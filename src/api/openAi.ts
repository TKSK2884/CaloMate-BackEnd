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
                    content:
                        "Your role is a personalized fitness trainer." +
                        " From now on, you should check and advise me on my physical information," +
                        " activity information, and target. Please answer in Korean",
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
