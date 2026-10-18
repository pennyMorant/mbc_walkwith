from __future__ import annotations

from PySide6.QtCore import Signal
from PySide6.QtWidgets import QHBoxLayout, QLabel, QPlainTextEdit, QPushButton, QVBoxLayout, QWidget


class TranscriptEditor(QWidget):
    save_requested = Signal(str)

    def __init__(self) -> None:
        super().__init__()
        self.editor = QPlainTextEdit()
        self.editor.setPlaceholderText("The transcript appears here after processing.")
        self.save_button = QPushButton("Save Reviewed Transcript")
        self.save_button.setEnabled(False)
        self.save_button.clicked.connect(
            lambda: self.save_requested.emit(self.editor.toPlainText())
        )
        header = QHBoxLayout()
        header.addWidget(QLabel("Transcript"))
        header.addStretch()
        header.addWidget(self.save_button)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addLayout(header)
        layout.addWidget(self.editor, 1)

    def set_transcript(self, text: str) -> None:
        self.editor.setPlainText(text)
        self.save_button.setEnabled(True)
