import { UserProfile } from "../structure/type";

export function generatePrompt(profile: UserProfile): string {
    const prompt = `My body information is ${profile.age} years old, 
        my gender is ${profile.gender}, I am ${profile.height}cm tall, 
        I weigh ${profile.weight}kg, 
        my activity level is ${profile.activityLevel}, 
        and my goal is ${profile.target}.
        Next, please refer to the contents and tell me 
        how to exercise and what to eat
        `;

    return prompt;
}
