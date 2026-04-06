import { NextRequest, NextResponse } from "next/server";
import {
  findCivilService,
  hasCivilKeyword,
  type CivilService,
} from "@/lib/civil-knowledge";
import {
  getOfficesWithWaiting,
  getBusStops,
  type OfficeWithWaiting,
  type BusStop,
} from "@/lib/api-clients";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  message: string;
  offices?: OfficeWithWaiting[];
  busStops?: BusStop[];
  civilServices?: CivilService[];
}

// 규칙 기반 응답 생성 (LLM API 없을 때 fallback)
function generateRuleBasedResponse(
  userMessage: string,
  services: CivilService[],
  offices: OfficeWithWaiting[],
  busStops: BusStop[]
): string {
  const parts: string[] = [];

  if (services.length > 0) {
    parts.push("안녕하세요! 문의하신 민원에 대해 안내드리겠습니다.\n");

    for (const svc of services) {
      parts.push(`📋 **${svc.name}**`);
      parts.push(`${svc.description}\n`);
      parts.push(`🏢 담당부서: ${svc.department}`);
      parts.push(`📄 필요서류:`);
      for (const doc of svc.documents) {
        parts.push(`  - ${doc}`);
      }
      parts.push("");
    }

    if (offices.length > 0) {
      const sorted = [...offices].sort(
        (a, b) => a.totalWaiting - b.totalWaiting
      );
      const recommended = sorted[0];

      parts.push("\n🏛️ **실시간 민원실 현황**");
      parts.push(
        `추천: **${recommended.csoNm}** (현재 대기 ${recommended.totalWaiting}명으로 가장 한산합니다)\n`
      );
    }

    if (busStops.length > 0) {
      parts.push("\n🚌 **근처 버스 정류소**");
      const shown = busStops.slice(0, 3);
      for (const stop of shown) {
        parts.push(
          `  - ${stop.psNm} (${stop.rteNo || "노선정보 없음"})`
        );
      }
    }
  } else {
    // 일반 인사 또는 민원과 무관한 메시지
    const greetings = ["안녕", "하이", "hello", "hi", "헬로"];
    const isGreeting = greetings.some((g) =>
      userMessage.toLowerCase().includes(g)
    );

    if (isGreeting) {
      parts.push(
        "안녕하세요! 🏛️ 민원 내비입니다.\n\n" +
          "민원 관련 궁금한 점을 물어보세요! 예를 들어:\n" +
          '- "전입신고 하려는데"\n' +
          '- "여권 발급 필요서류 알려줘"\n' +
          '- "주민등록등본 어디서 발급해?"\n' +
          '- "인감증명서 필요한 서류가 뭐야?"\n\n' +
          "민원 종류 파악, 필요 서류, 실시간 대기현황까지 한번에 안내해드립니다!"
      );
    } else {
      parts.push(
        "문의하신 내용을 정확히 파악하기 어렵습니다.\n\n" +
          "다음과 같은 민원 관련 질문을 해보세요:\n" +
          "- 전입신고, 전출신고\n" +
          "- 주민등록등본/초본 발급\n" +
          "- 여권 발급/재발급\n" +
          "- 인감증명서 발급\n" +
          "- 혼인신고, 출생신고\n" +
          "- 사업자등록\n" +
          "- 건축허가\n\n" +
          "원하시는 민원을 말씀해주시면 필요 서류와 가까운 민원실을 안내해드리겠습니다."
      );
    }
  }

  return parts.join("\n");
}

// LLM 호출 시도 (OpenAI 또는 Anthropic)
async function tryLLMResponse(
  messages: ChatMessage[],
  services: CivilService[],
  offices: OfficeWithWaiting[]
): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `당신은 '민원 내비'라는 민원 안내 AI 챗봇입니다.
사용자가 민원에 대해 질문하면 친절하고 정확하게 안내해주세요.

다음 정보를 활용하여 답변하세요:

${
  services.length > 0
    ? `[감지된 민원 서비스]
${services
  .map(
    (s) =>
      `- ${s.name}: ${s.description}
  담당부서: ${s.department}
  필요서류: ${s.documents.join(", ")}`
  )
  .join("\n")}`
    : ""
}

${
  offices.length > 0
    ? `[민원실 실시간 현황]
${offices
  .map(
    (o) =>
      `- ${o.csoNm}: 대기 ${o.totalWaiting}명 (${o.roadNmAddr || "주소 미상"})`
  )
  .join("\n")}`
    : ""
}

답변 규칙:
1. 한국어로 답변하세요.
2. 필요서류를 명확히 안내하세요.
3. 가장 한산한 민원실을 추천하세요.
4. 친절하고 간결하게 답변하세요.
5. 마크다운 형식을 사용하세요 (**, - 등).`;

  // Try OpenAI
  if (openaiKey && openaiKey.trim() !== "") {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-10),
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (err) {
      console.error("OpenAI API error:", err);
    }
  }

  // Try Anthropic
  if (anthropicKey && anthropicKey.trim() !== "") {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.content?.[0]?.text || null;
      }
    } catch (err) {
      console.error("Anthropic API error:", err);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "메시지가 필요합니다." },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;

    // 민원 서비스 키워드 감지
    const services = findCivilService(userMessage);
    const isCivilQuery = hasCivilKeyword(userMessage);

    // API 데이터 가져오기 (민원 키워드가 있을 때만)
    let offices: OfficeWithWaiting[] = [];
    let busStops: BusStop[] = [];

    if (isCivilQuery) {
      [offices, busStops] = await Promise.all([
        getOfficesWithWaiting(),
        getBusStops(),
      ]);
    }

    // LLM 시도 -> 실패 시 규칙 기반 fallback
    let responseMessage: string;
    const llmResponse = await tryLLMResponse(messages, services, offices);

    if (llmResponse) {
      responseMessage = llmResponse;
    } else {
      responseMessage = generateRuleBasedResponse(
        userMessage,
        services,
        offices,
        busStops
      );
    }

    const response: ChatResponse = {
      message: responseMessage,
    };

    if (offices.length > 0) {
      response.offices = offices.sort(
        (a, b) => a.totalWaiting - b.totalWaiting
      );
    }

    if (busStops.length > 0) {
      response.busStops = busStops.slice(0, 5);
    }

    if (services.length > 0) {
      response.civilServices = services;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
