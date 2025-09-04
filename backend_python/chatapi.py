import os
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import base64

load_dotenv()
my_api_key = os.getenv("OPEN_API_KEY")

# Use the new OpenAI v1 API client
client = OpenAI(
    # This is the default and can be omitted
    api_key=my_api_key,
)

class ChatRequest(BaseModel):
    prompt: str


class ChatResponse(BaseModel):
    response: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust as needed
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods, adjust as needed
    allow_headers=["*"],  # Allows all headers, adjust as needed
)


@app.post("/")
def ai_prompt(request: ChatRequest):
    response = client.responses.create(
        model="gpt-4o-mini",
        instructions="You are a comedian that makes kids laugh.",
        input=request.prompt
    )
    gpt_response = response.output[0].content[0].text
    return ChatResponse(response=gpt_response)

@app.post("/uploadfile/")
async def create_upload_file(
    prompt: str = Form(...),
    file: UploadFile = File(None)
):
    base64_image = None
    completion = None
    if file:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")

        completion = client.chat.completions.create(
            model="gpt-4.1",
            messages=[ 
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": prompt },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
        )
    else:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a helpful assistant"},
                {
                    "role": "user", 
                    "content": prompt
                }

            ]
        )

    if (completion):
        gpt_response = completion.choices[0].message.content
        return ChatResponse(response=gpt_response)
    return ChatResponse(response="No response from AI.")
