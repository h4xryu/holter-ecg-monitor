import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BookOpen, HelpCircle, MessageSquare, Video } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">도움말</h1>
        <p className="text-muted-foreground">ECG 모니터링 시스템 사용에 관한 도움말과 자주 묻는 질문을 확인하세요.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>빠른 시작 가이드</CardTitle>
            <CardDescription>시스템을 빠르게 시작하는 방법을 알아보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <Video className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <h4 className="font-medium">시스템 개요 비디오</h4>
                    <p className="text-sm text-gray-500">3분 안에 시스템의 주요 기능을 알아보세요.</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <h4 className="font-medium">사용자 매뉴얼</h4>
                    <p className="text-sm text-gray-500">상세한 사용 방법과 기능 설명을 확인하세요.</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-amber-500 mr-3" />
                  <div>
                    <h4 className="font-medium">기술 지원 문의</h4>
                    <p className="text-sm text-gray-500">문제가 있으신가요? 기술 지원팀에 문의하세요.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>주요 기능 안내</CardTitle>
            <CardDescription>시스템의 주요 기능과 사용법을 알아보세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h4 className="font-medium">실시간 모니터링</h4>
                    <p className="text-sm text-gray-500">실시간 ECG 데이터를 모니터링하는 방법을 알아보세요.</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <h4 className="font-medium">AI 분석 결과 해석</h4>
                    <p className="text-sm text-gray-500">AI 모델의 분석 결과를 이해하고 활용하는 방법을 알아보세요.</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <h4 className="font-medium">데이터 관리</h4>
                    <p className="text-sm text-gray-500">ECG 데이터를 저장하고 관리하는 방법을 알아보세요.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>자주 묻는 질문 (FAQ)</CardTitle>
          <CardDescription>사용자들이 자주 묻는 질문과 답변을 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>ECG 데이터는 어떻게 저장되나요?</AccordionTrigger>
              <AccordionContent>
                ECG 데이터는 기본적으로 로컬 데이터베이스에 저장됩니다. 설정에서 데이터 저장 옵션을 변경할 수 있으며,
                원시 데이터, 필터링된 데이터, 또는 이상 감지 데이터만 선택적으로 저장할 수 있습니다. 데이터는 암호화되어
                저장되며, 권한이 있는 사용자만 접근할 수 있습니다.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>AI 모델은 어떤 이상을 감지할 수 있나요?</AccordionTrigger>
              <AccordionContent>
                현재 AI 모델은 심실 조기 수축(VPC), 심방 조기 수축(APC), 심방 세동(AFib), 심실 빈맥(VT) 등의 주요
                부정맥을 감지할 수 있습니다. 설정 메뉴에서 감지하고자 하는 이상 유형을 선택할 수 있으며, 민감도를
                조절하여 오탐지와 미탐지 사이의 균형을 맞출 수 있습니다.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>실시간 모니터링 중 시스템 성능은 어떻게 되나요?</AccordionTrigger>
              <AccordionContent>
                시스템은 500Hz 샘플링 속도에서도 원활하게 작동하도록 최적화되어 있습니다. 일반적인 컴퓨터 환경에서는 CPU
                사용량이 10-20% 수준으로 유지됩니다. AI 분석은 별도의 프로세스로 실행되어 모니터링 성능에 영향을 미치지
                않습니다.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>알림 설정은 어떻게 변경하나요?</AccordionTrigger>
              <AccordionContent>
                알림 설정은 '알림' 페이지 또는 '설정' 페이지의 '계정' 탭에서 변경할 수 있습니다. 이메일 알림, SMS 알림
                등의 알림 방법과 실시간, 요약, 일일 요약 등의 알림 빈도를 설정할 수 있습니다. 또한 알림을 받고자 하는
                이상 유형도 선택할 수 있습니다.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>시스템 업데이트는 어떻게 진행되나요?</AccordionTrigger>
              <AccordionContent>
                시스템 업데이트는 자동으로 진행됩니다. 새로운 업데이트가 있을 경우 알림을 통해 안내되며, 업데이트는
                사용자가 편리한 시간에 진행할 수 있습니다. 업데이트 중에는 일시적으로 시스템 사용이 제한될 수 있으며,
                업데이트 완료 후 자동으로 재시작됩니다.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

