from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Any

import httpx

from .config import BackendConfig
from .models import SermonManifest


class BackendUploader:
    def __init__(self, config: BackendConfig) -> None:
        self._config = config
        self._client = httpx.Client(
            base_url=config.base_url.rstrip("/"),
            timeout=300.0,
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "x-client-platform": "local-sermon-studio",
            },
        )
        self._access_token: str | None = None

    def close(self) -> None:
        self._client.close()

    def ensure_logged_in(self) -> None:
        if self._access_token:
            return
        response = self._client.post(
            "/admin/auth/login",
            json={
                "email": self._config.email,
                "password": self._config.password,
            },
        )
        response.raise_for_status()
        data = response.json()["data"]
        self._access_token = data["accessToken"]

    def create_local_draft(self, manifest: SermonManifest) -> dict[str, Any]:
        self.ensure_logged_in()
        response = self._client.post(
            "/admin/sermons/local-drafts",
            headers=self._auth_headers(),
            json={
                "title": manifest.title,
                "speaker": manifest.speaker,
                "sermonDate": manifest.sermon_date,
                "series": manifest.series,
                "primaryReference": manifest.primary_reference,
                "summary": manifest.summary,
            },
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_sermon(self, sermon_id: str) -> dict[str, Any]:
        self.ensure_logged_in()
        response = self._client.get(
            f"/admin/sermons/{sermon_id}",
            headers=self._auth_headers(),
        )
        response.raise_for_status()
        return response.json()["data"]

    def upload_audio(
        self,
        sermon_id: str,
        revision: int,
        original_audio_path: str | Path,
    ) -> dict[str, Any]:
        self.ensure_logged_in()
        path = Path(original_audio_path).expanduser().resolve()
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        with path.open("rb") as handle:
            response = self._client.post(
                f"/admin/sermons/{sermon_id}/audio",
                headers={
                    **self._mutation_headers(revision),
                    "content-type": content_type,
                    "x-file-name": path.name,
                },
                content=handle.read(),
            )
        response.raise_for_status()
        return response.json()["data"]

    def upload_local_package(
        self,
        sermon_id: str,
        revision: int,
        manifest: SermonManifest,
        transcript_text: str,
        review_markdown: str,
        submit_for_review: bool = True,
    ) -> dict[str, Any]:
        self.ensure_logged_in()
        payload = manifest.to_backend_package(transcript_text, review_markdown)
        payload["submitForReview"] = submit_for_review
        response = self._client.post(
            f"/admin/sermons/{sermon_id}/local-package",
            headers=self._mutation_headers(revision),
            json=payload,
        )
        response.raise_for_status()
        return response.json()["data"]

    def publish(self, sermon_id: str, revision: int) -> dict[str, Any]:
        self.ensure_logged_in()
        response = self._client.post(
            f"/admin/sermons/{sermon_id}/publish",
            headers=self._mutation_headers(revision),
            json={},
        )
        response.raise_for_status()
        return response.json()["data"]

    def _auth_headers(self) -> dict[str, str]:
        if not self._access_token:
            raise RuntimeError("Uploader is not authenticated.")
        return {"authorization": f"Bearer {self._access_token}"}

    def _mutation_headers(self, revision: int) -> dict[str, str]:
        if not isinstance(revision, int) or isinstance(revision, bool) or revision < 0:
            raise ValueError("Sermon revision must be a non-negative integer.")
        return {
            **self._auth_headers(),
            "x-sermon-revision": str(revision),
        }
