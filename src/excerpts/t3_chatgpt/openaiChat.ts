// https://github.com/alex-popov-tech/t3_chatgpt/blob/b58629283adce50ac4e62c6a5485bbbbefb57f40/src/server/openaiChat.ts#L20-L35
  async makeTitle(history: Message[]): Promise<string> {
    const input = {
      role: "user",
      content:
        "Make a title for this chat which consist of few words, no quotes",
    } as Message;
    const res = await openai.chat.completions.create({
      model: this.model,
      messages: [
        ...history,
        { ...input, content: `${input.content}\n---${this.constraints}\n---` },
      ],
    });
    const outputContent = res?.choices[0]?.message?.content ?? "";
    return outputContent;
  }
