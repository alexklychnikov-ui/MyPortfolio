from pydantic import BaseModel, Field, HttpUrl


class CreatePngRequest(BaseModel):
    repository: HttpUrl


class CreatePngData(BaseModel):
    repository: str
    branch: str
    image_path: str
    readme_path: str
    replaced_existing_image: bool
    title: str


class CreatePngResponse(BaseModel):
    success: bool = True
    data: CreatePngData
