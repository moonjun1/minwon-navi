export interface CivilService {
  name: string;
  documents: string[];
  department: string;
  description: string;
}

export const CIVIL_SERVICES: Record<string, CivilService> = {
  전입신고: {
    name: "전입신고",
    documents: ["신분증", "전입세대 전원의 주민등록증"],
    department: "주민센터",
    description:
      "새로운 주소지로 이사한 후 14일 이내에 전입신고를 해야 합니다.",
  },
  전출신고: {
    name: "전출신고",
    documents: ["신분증"],
    department: "주민센터",
    description: "다른 시/군/구로 이사할 때 전출신고를 합니다.",
  },
  인감증명: {
    name: "인감증명서 발급",
    documents: ["신분증", "인감도장"],
    department: "주민센터",
    description:
      "부동산 거래, 자동차 매매 등에 필요한 인감증명서를 발급받습니다.",
  },
  주민등록등본: {
    name: "주민등록 등·초본 발급",
    documents: ["신분증"],
    department: "주민센터/무인발급기",
    description:
      "주민등록등본 또는 초본을 발급받습니다. 무인발급기에서도 가능합니다.",
  },
  여권: {
    name: "여권 발급/재발급",
    documents: ["여권용 사진 1매", "신분증", "구여권(재발급시)"],
    department: "구청 여권과",
    description:
      "여권 신규 발급 또는 재발급 신청입니다. 처리기간은 약 7~10일입니다.",
  },
  혼인신고: {
    name: "혼인신고",
    documents: [
      "혼인신고서",
      "신분증",
      "가족관계증명서",
      "혼인관계증명서",
      "성인 증인 2명의 서명",
    ],
    department: "주민센터/구청",
    description: "혼인신고서와 관련 서류를 제출하여 혼인 사실을 등록합니다.",
  },
  출생신고: {
    name: "출생신고",
    documents: ["출생신고서", "출생증명서", "신분증"],
    department: "주민센터/구청",
    description: "출생일로부터 1개월 이내에 출생신고를 해야 합니다.",
  },
  사망신고: {
    name: "사망신고",
    documents: ["사망신고서", "사망진단서(시체검안서)", "신분증"],
    department: "주민센터/구청",
    description: "사망 사실을 알게 된 날부터 1개월 이내에 신고합니다.",
  },
  운전면허: {
    name: "운전면허 관련",
    documents: ["신분증", "운전면허증", "사진 2매"],
    department: "경찰서/면허시험장",
    description:
      "운전면허 갱신, 재발급, 국제면허 발급 등을 처리합니다.",
  },
  자동차등록: {
    name: "자동차 등록/이전",
    documents: [
      "자동차등록신청서",
      "신분증",
      "자동차매매계약서",
      "자동차세 완납증명",
    ],
    department: "구청 차량등록과",
    description: "자동차 신규등록, 이전등록, 말소 등을 처리합니다.",
  },
  건축허가: {
    name: "건축허가 신청",
    documents: [
      "건축허가신청서",
      "설계도서",
      "토지등기사항증명서",
      "토지이용계획확인서",
    ],
    department: "구청 건축과",
    description: "건축물을 신축, 증축, 개축할 때 허가를 신청합니다.",
  },
  사업자등록: {
    name: "사업자등록",
    documents: ["사업자등록신청서", "신분증", "임대차계약서", "사업허가증(해당시)"],
    department: "세무서",
    description: "사업 개시일로부터 20일 이내에 사업자등록을 해야 합니다.",
  },
  민원24: {
    name: "정부24 온라인 민원",
    documents: ["공동인증서 또는 간편인증"],
    department: "온라인(정부24)",
    description:
      "정부24(gov.kr)에서 각종 민원서류를 온라인으로 발급받을 수 있습니다.",
  },
};

// 키워드와 민원 종류 매핑
const KEYWORD_MAP: Record<string, string[]> = {
  전입신고: ["전입", "이사", "주소변경", "주소이전", "전입신고"],
  전출신고: ["전출", "전출신고"],
  인감증명: ["인감", "인감증명", "인감도장"],
  주민등록등본: [
    "등본",
    "초본",
    "주민등록",
    "주민등록등본",
    "주민등록초본",
    "등초본",
  ],
  여권: ["여권", "패스포트", "passport", "여권발급", "여권재발급"],
  혼인신고: ["혼인", "결혼", "혼인신고"],
  출생신고: ["출생", "출산", "출생신고", "아기"],
  사망신고: ["사망", "사망신고"],
  운전면허: ["면허", "운전면허", "면허갱신", "면허재발급", "국제면허"],
  자동차등록: ["자동차", "차량등록", "차량이전", "자동차등록"],
  건축허가: ["건축", "건축허가", "신축", "증축"],
  사업자등록: ["사업자", "사업자등록", "창업"],
  민원24: ["온라인", "정부24", "인터넷발급"],
};

export function findCivilService(message: string): CivilService[] {
  const results: CivilService[] = [];
  const normalizedMessage = message.toLowerCase();

  for (const [serviceKey, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        const service = CIVIL_SERVICES[serviceKey];
        if (service && !results.find((r) => r.name === service.name)) {
          results.push(service);
        }
        break;
      }
    }
  }

  return results;
}

export function hasCivilKeyword(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  for (const keywords of Object.values(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        return true;
      }
    }
  }
  return false;
}
