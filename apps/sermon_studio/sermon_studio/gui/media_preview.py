from __future__ import annotations

from PySide6.QtCore import Qt, QUrl, Signal
from PySide6.QtMultimedia import QAudioOutput, QMediaPlayer
from PySide6.QtMultimediaWidgets import QVideoWidget
from PySide6.QtWidgets import QHBoxLayout, QLabel, QPushButton, QSlider, QVBoxLayout, QWidget


class MediaPreview(QWidget):
    position_changed = Signal(int)

    def __init__(self) -> None:
        super().__init__()
        self.player = QMediaPlayer(self)
        self.audio_output = QAudioOutput(self)
        self.video = QVideoWidget()
        self.player.setAudioOutput(self.audio_output)
        self.player.setVideoOutput(self.video)

        self.play_button = QPushButton("Play")
        self.timeline = QSlider(Qt.Orientation.Horizontal)
        self.timeline.setRange(0, 0)
        self.time_label = QLabel("00:00 / 00:00")

        controls = QHBoxLayout()
        controls.addWidget(self.play_button)
        controls.addWidget(self.timeline, 1)
        controls.addWidget(self.time_label)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.video, 1)
        layout.addLayout(controls)

        self.play_button.clicked.connect(self._toggle)
        self.timeline.sliderMoved.connect(self.player.setPosition)
        self.player.positionChanged.connect(self._position)
        self.player.durationChanged.connect(self._duration)
        self.player.playbackStateChanged.connect(self._state)

    @property
    def position_seconds(self) -> float:
        return self.player.position() / 1000

    def load(self, path: str) -> None:
        self.player.setSource(QUrl.fromLocalFile(path))

    def _toggle(self) -> None:
        if self.player.playbackState() == QMediaPlayer.PlaybackState.PlayingState:
            self.player.pause()
        else:
            self.player.play()

    def _position(self, milliseconds: int) -> None:
        if not self.timeline.isSliderDown():
            self.timeline.setValue(milliseconds)
        self._update_label(milliseconds, self.player.duration())
        self.position_changed.emit(milliseconds)

    def _duration(self, milliseconds: int) -> None:
        self.timeline.setRange(0, max(0, milliseconds))
        self._update_label(self.player.position(), milliseconds)

    def _state(self, state: QMediaPlayer.PlaybackState) -> None:
        playing = state == QMediaPlayer.PlaybackState.PlayingState
        self.play_button.setText("Pause" if playing else "Play")

    def _update_label(self, position: int, duration: int) -> None:
        self.time_label.setText(
            f"{_format_milliseconds(position)} / {_format_milliseconds(duration)}"
        )


def _format_milliseconds(value: int) -> str:
    seconds = max(0, value // 1000)
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours:
        return f"{hours:02}:{minutes:02}:{seconds:02}"
    return f"{minutes:02}:{seconds:02}"
