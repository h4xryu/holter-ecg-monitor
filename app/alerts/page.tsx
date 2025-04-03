import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Bell, CheckCircle } from "lucide-react"

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">알림</h1>
        <p className="text-muted-foreground">시스템에서 발생한 알림을 확인하고 관리하세요.</p>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>알림 목록</CardTitle>
            <CardDescription>최근 발생한 알림 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  type: "warning",
                  title: "심실 조기 수축 감지",
                  description: "환자 ID: 12345에서 심실 조기 수축이 감지되었습니다.",
                  time: "오늘 09:32",
                  read: false,
                },
                {
                  id: 2,
                  type: "info",
                  title: "모니터링 시작",
                  description: "환자 ID: 12345의 모니터링이 시작되었습니다.",
                  time: "오늘 08:15",
                  read: true,
                },
                {
                  id: 3,
                  type: "success",
                  title: "시스템 업데이트 완료",
                  description: "시스템이 최신 버전으로 업데이트되었습니다.",
                  time: "어제 14:20",
                  read: true,
                },
                {
                  id: 4,
                  type: "warning",
                  title: "심방 조기 수축 감지",
                  description: "환자 ID: 12345에서 심방 조기 수축이 감지되었습니다.",
                  time: "어제 10:45",
                  read: true,
                },
                {
                  id: 5,
                  type: "info",
                  title: "새로운 AI 모델 적용",
                  description: "새로운 AI 분석 모델이 적용되었습니다.",
                  time: "2일 전",
                  read: true,
                },
              ].map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-md flex items-start ${alert.read ? "" : "bg-gray-50 border-l-4 border-l-blue-500"}`}
                >
                  <div className="mr-4 mt-1">
                    {alert.type === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : alert.type === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{alert.title}</h4>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
            <CardDescription>알림 수신 방법 및 유형을 설정하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">알림 유형</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="alert-type-1" className="mr-2" checked />
                    <label htmlFor="alert-type-1">심전도 이상 감지</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="alert-type-2" className="mr-2" checked />
                    <label htmlFor="alert-type-2">시스템 알림</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="alert-type-3" className="mr-2" checked />
                    <label htmlFor="alert-type-3">업데이트 알림</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">알림 방법</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="alert-method-1" className="mr-2" checked />
                    <label htmlFor="alert-method-1">시스템 내 알림</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="alert-method-2" className="mr-2" checked />
                    <label htmlFor="alert-method-2">이메일 알림</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="alert-method-3" className="mr-2" />
                    <label htmlFor="alert-method-3">SMS 알림</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">알림 빈도</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="radio" id="alert-freq-1" name="alert-freq" className="mr-2" checked />
                    <label htmlFor="alert-freq-1">실시간 (즉시)</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="alert-freq-2" name="alert-freq" className="mr-2" />
                    <label htmlFor="alert-freq-2">요약 (1시간마다)</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="alert-freq-3" name="alert-freq" className="mr-2" />
                    <label htmlFor="alert-freq-3">일일 요약</label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

