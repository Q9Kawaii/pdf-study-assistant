import unittest
from types import SimpleNamespace
from unittest.mock import patch

from google.genai import errors

from config import OCR_MAX_CALLS
from ocr import group_pages, ocr_pages, split_reply
from tests.test_pdf_reader import blank_pdf


class FakeVision:
    """Returns canned replies, one for each call."""

    def __init__(self, replies):
        self.replies = iter(replies)
        self.models = self
        self.calls = 0

    def generate_content(self, model, contents, config):
        self.calls += 1
        reply = next(self.replies)
        if isinstance(reply, Exception):
            raise reply
        return SimpleNamespace(text=reply)


def quota_error():
    return errors.APIError(429, {"error": {"message": "Quota", "status": "LIMIT"}})


class GroupPagesTests(unittest.TestCase):
    def test_few_pages_get_one_call_each(self):
        self.assertEqual(group_pages([1, 2, 3]), [[1], [2], [3]])

    def test_never_more_calls_than_the_limit(self):
        groups = group_pages(list(range(1, 21)))
        self.assertEqual(len(groups), OCR_MAX_CALLS)
        self.assertEqual(sum(groups, []), list(range(1, 21)))


class SplitReplyTests(unittest.TestCase):
    def test_gives_each_page_its_real_number(self):
        reply = "PAGE-ab-1\nfirst\nPAGE-ab-2\nsecond"
        pages, missing = split_reply(reply, "PAGE-ab", [4, 9])
        self.assertEqual(
            pages,
            [{"page": 4, "text": "first"}, {"page": 9, "text": "second"}],
        )
        self.assertEqual(missing, [])

    def test_reports_a_page_the_model_left_out(self):
        pages, missing = split_reply("PAGE-ab-1\nfirst", "PAGE-ab", [4, 9])
        self.assertEqual(len(pages), 1)
        self.assertEqual(missing, [9])

    def test_a_skipped_page_is_never_a_success(self):
        pages, missing = split_reply("PAGE-ab-1\n\nPAGE-ab-2\ntext", "PAGE-ab", [1, 2])
        self.assertEqual(pages, [{"page": 2, "text": "text"}])
        self.assertEqual(missing, [1])

    def test_text_on_a_page_cannot_fake_a_marker(self):
        reply = "PAGE-ab-1\nPAGE-99-2\nfake page"
        pages, missing = split_reply(reply, "PAGE-ab", [1, 2])
        self.assertEqual(pages[0]["text"], "PAGE-99-2\nfake page")
        self.assertEqual(missing, [2])

    def test_single_page_works_without_a_marker(self):
        pages, _ = split_reply("just text", "PAGE-ab", [3])
        self.assertEqual(pages, [{"page": 3, "text": "just text"}])


@patch("ocr.time.sleep")
class OcrPagesTests(unittest.TestCase):
    def test_keeps_real_page_numbers(self, sleep):
        pages, failed = ocr_pages(FakeVision(["same"] * 2), blank_pdf(5), [2, 5])
        self.assertEqual({page["page"] for page in pages}, {2, 5})
        self.assertEqual(failed, [])

    def test_waits_once_and_retries_on_a_rate_limit(self, sleep):
        client = FakeVision([quota_error(), "good"])
        pages, failed = ocr_pages(client, blank_pdf(1), [1])
        self.assertEqual(len(pages), 1)
        self.assertEqual(failed, [])
        sleep.assert_called_once()

    def test_daily_limit_is_not_worth_waiting_for(self, sleep):
        daily = errors.APIError(429, {"error": {"message": "Requests per day exceeded", "status": "LIMIT"}})
        pages, failed = ocr_pages(FakeVision([daily, daily]), blank_pdf(1), [1])
        self.assertEqual((pages, failed), ([], [1]))
        sleep.assert_not_called()

    def test_a_failed_group_does_not_lose_the_others(self, sleep):
        client = FakeVision(["good"] + [quota_error()] * 4)
        pages, failed = ocr_pages(client, blank_pdf(2), [1, 2])
        self.assertEqual(len(pages), 1)
        self.assertEqual(len(failed), 1)

    def test_a_skipped_page_gets_a_second_chance(self, sleep):
        client = FakeVision(["", "found it"])
        pages, failed = ocr_pages(client, blank_pdf(1), [1])
        self.assertEqual(pages, [{"page": 1, "text": "found it"}])
        self.assertEqual(failed, [])

    def test_a_page_empty_twice_is_reported(self, sleep):
        pages, failed = ocr_pages(FakeVision(["", ""]), blank_pdf(1), [1])
        self.assertEqual((pages, failed), ([], [1]))


if __name__ == "__main__":
    unittest.main()
