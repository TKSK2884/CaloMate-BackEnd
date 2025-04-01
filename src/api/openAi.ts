import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function callOpenAIAPI(prompt: string): Promise<string | null> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
                    You are a personalized fitness trainer AI.  
                    Based on the user's profile, recommend today’s diet and workout.
                    
                    Guidelines:
                    - Base the diet recommendations on common Korean meals and ingredients.
                    - Make sure the suggestions are culturally appropriate for Korean users.

                    For workouts, recommend realistic home or outdoor exercises suitable for Korean users (e.g. apartment-friendly, gym-less options).

                    Respond ONLY with valid JSON.  
                    DO NOT include any explanation, greetings, or extra text.  
                    The JSON values (diet/workout items) MUST be written in Korean.
                    
                    JSON format example:
                    {
                    "diet": [
                    {
                        "meal": "아침: 현미밥, 미역국, 계란찜",
                        "calories": 420,
                        "carbs": 55,
                        "protein": 20,
                        "fat": 12
                    },
                    {
                        "meal": "점심: 보리밥, 불고기, 배추김치",
                        "calories": 610,
                        "carbs": 65,
                        "protein": 35,
                        "fat": 20
                    },
                    {
                        "meal": "저녁: 고구마, 닭가슴살, 샐러드",
                        "calories": 500,
                        "carbs": 45,
                        "protein": 40,
                        "fat": 10
                    }
                    ],
                    "workout": [
                    "스트레칭 10분",
                    "스쿼트 3세트",
                    "실내 유산소 운동 15분"
                    ]
                }
                    `.trim(),
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        return completion.choices[0].message.content;

        // console.log(completion.choices[0].message);
    } catch (error) {
        console.log("callOpenAI error:", error);
        return null;
    }
}
