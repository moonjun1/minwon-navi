const API_KEY = process.env.DATA_GO_KR_API_KEY || "";
const CSO_BASE = "https://apis.data.go.kr/B551982/cso_v2";
const BUS_BASE = "https://apis.data.go.kr/B551982/rte";

export interface CivilOffice {
  csoNm: string; // 민원실명
  rdnmAdr: string; // 도로명주소
  lat: string; // 위도
  lot: string; // 경도
  opnBgngTm: string; // 운영시작시간
  opnEndTm: string; // 운영종료시간
  nghtOpnYn: string; // 야간운영여부
  stdgCd: string; // 지자체코드
}

export interface CivilOfficeWaiting {
  csoNm: string; // 민원실명
  taskNm: string; // 업무명
  wtngCnt: number; // 대기인수
}

export interface BusStop {
  psNm: string; // 정류소명
  lat: string; // 위도
  lot: string; // 경도
  rteNo: string; // 노선번호
}

async function fetchApi<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    const items = data?.body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch (err) {
    console.error("API fetch error:", err);
    return [];
  }
}

export async function getCivilOffices(
  stdgCd?: string
): Promise<CivilOffice[]> {
  const stdgParam = stdgCd ? `&stdgCd=${stdgCd}` : "";
  return fetchApi<CivilOffice>(
    `${CSO_BASE}/cso_info_v2?serviceKey=${API_KEY}&type=json&numOfRows=100&pageNo=1${stdgParam}`
  );
}

export async function getCivilOfficeWaiting(
  stdgCd?: string
): Promise<CivilOfficeWaiting[]> {
  const stdgParam = stdgCd ? `&stdgCd=${stdgCd}` : "";
  return fetchApi<CivilOfficeWaiting>(
    `${CSO_BASE}/cso_realtime_v2?serviceKey=${API_KEY}&type=json&numOfRows=100&pageNo=1${stdgParam}`
  );
}

export async function getBusStops(stdgCd?: string): Promise<BusStop[]> {
  const stdgParam = stdgCd ? `&stdgCd=${stdgCd}` : "";
  return fetchApi<BusStop>(
    `${BUS_BASE}/ps_info?serviceKey=${API_KEY}&type=json&numOfRows=50&pageNo=1${stdgParam}`
  );
}

export interface OfficeWithWaiting extends CivilOffice {
  waitingInfo: CivilOfficeWaiting[];
  totalWaiting: number;
}

export async function getOfficesWithWaiting(
  stdgCd?: string
): Promise<OfficeWithWaiting[]> {
  const [offices, waitingList] = await Promise.all([
    getCivilOffices(stdgCd),
    getCivilOfficeWaiting(stdgCd),
  ]);

  return offices.map((office) => {
    const waitingInfo = waitingList.filter(
      (w) => w.csoNm === office.csoNm
    );
    const totalWaiting = waitingInfo.reduce(
      (sum, w) => sum + (Number(w.wtngCnt) || 0),
      0
    );
    return { ...office, waitingInfo, totalWaiting };
  });
}
