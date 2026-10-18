from __future__ import annotations

import unittest
from unittest.mock import MagicMock

from sermon_studio.processing_control import (
    CancellationToken,
    ProcessingCancelled,
)


class ProcessingControlTest(unittest.TestCase):
    def test_cancelled_token_raises(self) -> None:
        token = CancellationToken()

        token.cancel()

        with self.assertRaises(ProcessingCancelled):
            token.raise_if_cancelled()

    def test_cancel_terminates_bound_process(self) -> None:
        process = MagicMock()
        process.poll.return_value = None
        token = CancellationToken()
        token.bind_process(process)

        token.cancel()

        process.terminate.assert_called_once_with()


if __name__ == "__main__":
    unittest.main()
