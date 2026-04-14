"""
tests/test_templates.py — template CRUD endpoint tests.
"""

import pytest


@pytest.mark.asyncio
async def test_create_template(client, auth_headers):
    resp = await client.post(
        "/templates/",
        json={"title": "Follow Up", "content": "Thank you for your email.", "tone": "professional"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Follow Up"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_templates(client, auth_headers):
    await client.post(
        "/templates/",
        json={"title": "Template A", "content": "Content A"},
        headers=auth_headers,
    )
    resp = await client.get("/templates/", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_search_templates(client, auth_headers):
    await client.post(
        "/templates/",
        json={"title": "Unique XYZ Template", "content": "Body"},
        headers=auth_headers,
    )
    resp = await client.get("/templates/?search=XYZ", headers=auth_headers)
    assert resp.status_code == 200
    results = resp.json()
    assert any("XYZ" in t["title"] for t in results)


@pytest.mark.asyncio
async def test_update_template(client, auth_headers):
    create = await client.post(
        "/templates/",
        json={"title": "Old Title", "content": "Old Content"},
        headers=auth_headers,
    )
    tid = create.json()["id"]
    resp = await client.put(
        f"/templates/{tid}",
        json={"title": "New Title"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"


@pytest.mark.asyncio
async def test_delete_template(client, auth_headers):
    create = await client.post(
        "/templates/",
        json={"title": "Delete Me", "content": "Content"},
        headers=auth_headers,
    )
    tid = create.json()["id"]
    resp = await client.delete(f"/templates/{tid}", headers=auth_headers)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_get_nonexistent_template(client, auth_headers):
    import uuid
    resp = await client.get(f"/templates/{uuid.uuid4()}", headers=auth_headers)
    assert resp.status_code == 404
