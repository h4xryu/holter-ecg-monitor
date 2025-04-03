import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Download, Filter, Search } from "lucide-react"

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">기록</h1>
        <p className="text-muted-foreground">과거 모니터링 데이터 및 이벤트 기록을 확인하세요.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
          <CardDescription>특정 기간 또는 조건으로 기록을 검색하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작 날짜</label>
                <div className="relative">
                  <input type="date" className="w-full p-2 pl-10 border rounded-md" value="2023-04-01" />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">종료 날짜</label>
                <div className="relative">
                  <input type="date" className="w-full p-2 pl-10 border rounded-md" value="2023-04-30" />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">이벤트 유형</label>
                <div className="relative">
                  <select className="w-full p-2 pl-10 border rounded-md appearance-none">
                    <option>모든 이벤트</option>
                    <option>이상 감지</option>
                    <option>시스템 이벤트</option>
                    <option>사용자 활동</option>
                  </select>
                  <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="relative">
              <input type="text" placeholder="검색어를 입력하세요..." className="w-full p-2 pl-10 border rounded-md" />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline">초기화</Button>
              <Button>검색</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>기록 목록</CardTitle>
            <CardDescription>총 245개의 기록이 있습니다.</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left font-medium text-gray-500">날짜/시간</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">이벤트 유형</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">설명</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">심박수</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-500">조치</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    id: 1,
                    datetime: "2023-04-30 09:32:15",
                    type: "이상 감지",
                    description: "심실 조기 수축 감지",
                    heartRate: "78 BPM",
                  },
                  {
                    id: 2,
                    datetime: "2023-04-30 08:15:42",
                    type: "시스템",
                    description: "모니터링 시작됨",
                    heartRate: "72 BPM",
                  },
                  {
                    id: 3,
                    datetime: "2023-04-29 14:20:33",
                    type: "시스템",
                    description: "시스템 업데이트 완료",
                    heartRate: "-",
                  },
                  {
                    id: 4,
                    datetime: "2023-04-29 10:45:18",
                    type: "이상 감지",
                    description: "심방 조기 수축 감지",
                    heartRate: "85 BPM",
                  },
                  {
                    id: 5,
                    datetime: "2023-04-28 16:12:05",
                    type: "시스템",
                    description: "새로운 AI 모델 적용",
                    heartRate: "-",
                  },
                ].map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{record.datetime}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          record.type === "이상 감지"
                            ? "bg-amber-100 text-amber-800"
                            : record.type === "시스템"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {record.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{record.description}</td>
                    <td className="py-3 px-4">{record.heartRate}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        상세보기
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">1-5 / 245 기록</div>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" disabled>
                이전
              </Button>
              <Button variant="outline" size="sm" className="bg-gray-100">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                ...
              </Button>
              <Button variant="outline" size="sm">
                25
              </Button>
              <Button variant="outline" size="sm">
                다음
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

