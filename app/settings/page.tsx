import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-muted-foreground">시스템 설정을 관리하세요.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">일반</TabsTrigger>
          <TabsTrigger value="monitoring">모니터링</TabsTrigger>
          <TabsTrigger value="ai">AI 모델</TabsTrigger>
          <TabsTrigger value="account">계정</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
              <CardDescription>시스템의 기본 설정을 관리하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">언어 설정</h4>
                <select className="w-full p-2 border rounded-md">
                  <option selected>한국어</option>
                  <option>English</option>
                  <option>日本語</option>
                  <option>中文</option>
                </select>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">시간대 설정</h4>
                <select className="w-full p-2 border rounded-md">
                  <option selected>(GMT+09:00) 서울, 도쿄</option>
                  <option>(GMT+00:00) UTC</option>
                  <option>(GMT-08:00) 로스앤젤레스</option>
                  <option>(GMT-05:00) 뉴욕</option>
                </select>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">테마 설정</h4>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input type="radio" id="theme-light" name="theme" className="mr-2" checked />
                    <label htmlFor="theme-light">라이트 모드</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="theme-dark" name="theme" className="mr-2" />
                    <label htmlFor="theme-dark">다크 모드</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="theme-system" name="theme" className="mr-2" />
                    <label htmlFor="theme-system">시스템 설정 따르기</label>
                  </div>
                </div>
              </div>

              <Button>설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>모니터링 설정</CardTitle>
              <CardDescription>ECG 모니터링 관련 설정을 관리하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">샘플링 속도</h4>
                <select className="w-full p-2 border rounded-md">
                  <option>250 Hz</option>
                  <option selected>500 Hz</option>
                  <option>1000 Hz</option>
                </select>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">필터 설정</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="filter-1" className="mr-2" checked />
                    <label htmlFor="filter-1">전원선 노이즈 필터 (50/60 Hz)</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="filter-2" className="mr-2" checked />
                    <label htmlFor="filter-2">기저선 변동 보정</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="filter-3" className="mr-2" checked />
                    <label htmlFor="filter-3">근전도 노이즈 필터</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">데이터 저장 설정</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="save-1" className="mr-2" checked />
                    <label htmlFor="save-1">원시 데이터 저장</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="save-2" className="mr-2" checked />
                    <label htmlFor="save-2">필터링된 데이터 저장</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="save-3" className="mr-2" checked />
                    <label htmlFor="save-3">이상 감지 데이터만 저장</label>
                  </div>
                </div>
              </div>

              <Button>설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI 모델 설정</CardTitle>
              <CardDescription>AI 모델 및 분석 설정을 관리하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">AI 모델 선택</h4>
                <select className="w-full p-2 border rounded-md">
                  <option>기본 모델 (v1.0)</option>
                  <option selected>고급 모델 (v2.0)</option>
                  <option>실험적 모델 (v3.0 베타)</option>
                </select>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">분석 민감도</h4>
                <input type="range" min="1" max="10" value="7" className="w-full" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>낮음 (오탐지 감소)</span>
                  <span>중간</span>
                  <span>높음 (미탐지 감소)</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">감지 대상 이상</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="detect-1" className="mr-2" checked />
                    <label htmlFor="detect-1">심실 조기 수축 (VPC)</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="detect-2" className="mr-2" checked />
                    <label htmlFor="detect-2">심방 조기 수축 (APC)</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="detect-3" className="mr-2" checked />
                    <label htmlFor="detect-3">심방 세동 (AFib)</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="detect-4" className="mr-2" checked />
                    <label htmlFor="detect-4">심실 빈맥 (VT)</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">AI 서버 설정</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm">서버 URL</label>
                    <input type="text" className="w-full p-2 border rounded-md" value="http://localhost:5000/predict" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">API 키</label>
                    <input type="password" className="w-full p-2 border rounded-md" value="••••••••••••••••" />
                  </div>
                </div>
              </div>

              <Button>설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>계정 설정</CardTitle>
              <CardDescription>사용자 계정 정보를 관리하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">사용자 정보</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm">이름</label>
                    <input type="text" className="w-full p-2 border rounded-md" value="홍길동" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">이메일</label>
                    <input type="email" className="w-full p-2 border rounded-md" value="user@example.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">직책</label>
                    <input type="text" className="w-full p-2 border rounded-md" value="의료 기술자" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">비밀번호 변경</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm">현재 비밀번호</label>
                    <input type="password" className="w-full p-2 border rounded-md" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">새 비밀번호</label>
                    <input type="password" className="w-full p-2 border rounded-md" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">새 비밀번호 확인</label>
                    <input type="password" className="w-full p-2 border rounded-md" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">알림 설정</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="notify-1" className="mr-2" checked />
                    <label htmlFor="notify-1">이메일 알림 수신</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="notify-2" className="mr-2" />
                    <label htmlFor="notify-2">SMS 알림 수신</label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button>정보 저장</Button>
                <Button variant="outline">로그아웃</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

