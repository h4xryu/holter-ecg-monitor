import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Heart, AlertTriangle, Clock, Bell, Settings, History } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">ECG 모니터링 시스템의 주요 정보를 확인하세요.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 심박수</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72 BPM</div>
            <p className="text-xs text-muted-foreground">정상 범위 내</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이상 감지</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">지난 24시간 동안</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">모니터링 시간</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12:42:18</div>
            <p className="text-xs text-muted-foreground">연속 모니터링 시간</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI 분석 상태</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">활성화</div>
            <p className="text-xs text-muted-foreground">실시간 분석 중</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>시스템의 최근 활동 내역입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:32", message: "이상 심박 감지됨", type: "warning" },
                { time: "08:15", message: "모니터링 시작됨", type: "info" },
                { time: "어제", message: "시스템 업데이트 완료", type: "success" },
                { time: "어제", message: "새로운 AI 모델 적용됨", type: "info" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      activity.type === "warning"
                        ? "bg-amber-500"
                        : activity.type === "success"
                          ? "bg-green-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <div className="text-sm text-gray-500 w-16">{activity.time}</div>
                  <div className="text-sm">{activity.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>빠른 액세스</CardTitle>
            <CardDescription>자주 사용하는 기능에 빠르게 접근하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/monitoring">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center">
                  <Activity className="h-8 w-8 text-red-500 mb-2" />
                  <div className="font-medium">심전도 모니터링</div>
                </div>
              </Link>
              <Link href="/alerts">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center">
                  <Bell className="h-8 w-8 text-amber-500 mb-2" />
                  <div className="font-medium">알림 확인</div>
                </div>
              </Link>
              <Link href="/history">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center">
                  <History className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="font-medium">기록 조회</div>
                </div>
              </Link>
              <Link href="/settings">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center">
                  <Settings className="h-8 w-8 text-gray-500 mb-2" />
                  <div className="font-medium">설정</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

