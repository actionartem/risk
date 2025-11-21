"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"

interface InputState {
  // Объёмы разработки
  contractHours: number
  contractDebt: number
  minorHours: number
  minorDebt: number

  // Хотфиксы
  autoCalculateHotfix: boolean
  hotfixReleases: number
  hotfixTasksPerRelease: number
  hotfixHoursPerTask: number
  manualHotfixHours: number

  // Календарь
  workDaysPerYear: number
  vacationDays: number
  sickDays: number
  hoursPerDay: number
  productivityPercent: number

  // Риски задач
  riskPercent: number

  // Текучка
  developersTurnover: number
  productivityBeforeLeaving: number
  monthsWithoutPerson: number
  productivityOnboarding: number

  // Команда
  plannedTeamSize: number
}

export default function TeamPlanningPage() {
  const [inputs, setInputs] = useState<InputState>({
    contractHours: 5500,
    contractDebt: 1000,
    minorHours: 870,
    minorDebt: 830,
    autoCalculateHotfix: true,
    hotfixReleases: 42,
    hotfixTasksPerRelease: 5,
    hotfixHoursPerTask: 8,
    manualHotfixHours: 1680,
    workDaysPerYear: 247,
    vacationDays: 28,
    sickDays: 14,
    hoursPerDay: 8,
    productivityPercent: 75,
    riskPercent: 10,
    developersTurnover: 2,
    productivityBeforeLeaving: 50,
    monthsWithoutPerson: 1,
    productivityOnboarding: 50,
    plannedTeamSize: 7,
  })

  const updateInput = (key: keyof InputState, value: number | boolean) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  // Расчеты
  const calculations = useMemo(() => {
    // Хотфиксы
    const hotfixHours = inputs.autoCalculateHotfix
      ? inputs.hotfixReleases * inputs.hotfixTasksPerRelease * inputs.hotfixHoursPerTask
      : inputs.manualHotfixHours

    // Базовый объём
    const baseVolume = inputs.contractHours + inputs.contractDebt + inputs.minorHours + inputs.minorDebt + hotfixHours

    // С учётом рисков
    const volumeWithRisks = baseVolume * (1 + inputs.riskPercent / 100)

    // Календарь
    const realWorkDays = inputs.workDaysPerYear - inputs.vacationDays - inputs.sickDays
    const bruttoHoursPerYear = realWorkDays * inputs.hoursPerDay
    const effectiveHoursPerDev = bruttoHoursPerYear * (inputs.productivityPercent / 100)

    // Потери от текучки
    const bruttoHoursPerMonth = bruttoHoursPerYear / 12
    const normalMonthlyProductivityHours = bruttoHoursPerMonth * (inputs.productivityPercent / 100)

    const lossLastMonth =
      normalMonthlyProductivityHours - (bruttoHoursPerMonth * inputs.productivityBeforeLeaving) / 100
    const lossEmptyMonth = normalMonthlyProductivityHours * inputs.monthsWithoutPerson
    const lossOnboardingMonth =
      normalMonthlyProductivityHours - (bruttoHoursPerMonth * inputs.productivityOnboarding) / 100

    const turnoverLossesPerPerson = lossLastMonth + lossEmptyMonth + lossOnboardingMonth
    const totalTurnoverLosses = turnoverLossesPerPerson * inputs.developersTurnover

    // Итоговая потребность
    const totalDemand = volumeWithRisks + totalTurnoverLosses

    // Требуемое количество людей
    const fteNeeded = totalDemand / effectiveHoursPerDev

    // Мощность команды
    const teamCapacity = effectiveHoursPerDev * inputs.plannedTeamSize

    // Покрытие
    const coveragePercent = (teamCapacity / totalDemand) * 100

    // Долг
    const debtHours = Math.max(0, totalDemand - teamCapacity)

    return {
      hotfixHours,
      baseVolume,
      volumeWithRisks,
      effectiveHoursPerDev,
      bruttoHoursPerYear,
      realWorkDays,
      totalTurnoverLosses,
      turnoverLossesPerPerson,
      totalDemand,
      fteNeeded,
      teamCapacity,
      coveragePercent,
      debtHours,
    }
  }, [inputs])

  // Данные для графика структуры нагрузки
  const loadStructureData = [
    { name: "Контракты", value: inputs.contractHours, fill: "hsl(var(--chart-1))" },
    { name: "Долги контрактов", value: inputs.contractDebt, fill: "hsl(var(--chart-2))" },
    { name: "Миноры", value: inputs.minorHours, fill: "hsl(var(--chart-3))" },
    { name: "Долги миноров", value: inputs.minorDebt, fill: "hsl(var(--chart-4))" },
    { name: "Хотфиксы", value: calculations.hotfixHours, fill: "hsl(var(--chart-5))" },
    { name: "Риски (10%)", value: calculations.volumeWithRisks - calculations.baseVolume, fill: "#f59e0b" },
    { name: "Потери от текучки", value: calculations.totalTurnoverLosses, fill: "#ef4444" },
  ]

  // Данные для сравнения спроса и мощности
  const demandVsCapacityData = [
    {
      name: "Часы",
      Потребность: Math.round(calculations.totalDemand),
      "Мощность команды": Math.round(calculations.teamCapacity),
    },
  ]

  // Данные для графика долга при разном количестве людей
  const debtScenarios = useMemo(() => {
    const scenarios = []
    for (let size = 3; size <= 15; size++) {
      const capacity = calculations.effectiveHoursPerDev * size
      const debt = Math.max(0, calculations.totalDemand - capacity)
      scenarios.push({
        name: `${size} чел`,
        debt: Math.round(debt),
      })
    }
    return scenarios
  }, [calculations])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Планирование загрузки команды разработки</h1>
          <p className="text-muted-foreground">
            Расчёт необходимого количества разработчиков с учётом объёма работ, рисков и текучки кадров
          </p>
        </div>

        {/* Объёмы разработки */}
        <Card>
          <CardHeader>
            <CardTitle>Объёмы разработки</CardTitle>
            <CardDescription>Введите планируемые объёмы работ на год</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contractHours">Контрактные часы на год</Label>
                <Input
                  id="contractHours"
                  type="number"
                  value={inputs.contractHours}
                  onChange={(e) => updateInput("contractHours", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractDebt">Долги по контрактам прошлых лет</Label>
                <Input
                  id="contractDebt"
                  type="number"
                  value={inputs.contractDebt}
                  onChange={(e) => updateInput("contractDebt", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minorHours">Минорные часы на год</Label>
                <Input
                  id="minorHours"
                  type="number"
                  value={inputs.minorHours}
                  onChange={(e) => updateInput("minorHours", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minorDebt">Долги по минорам прошлых лет</Label>
                <Input
                  id="minorDebt"
                  type="number"
                  value={inputs.minorDebt}
                  onChange={(e) => updateInput("minorDebt", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoCalc" className="text-base font-semibold">
                  Хотфиксы и поддержка
                </Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="autoCalc" className="text-sm font-normal">
                    Автоматический расчёт
                  </Label>
                  <Switch
                    id="autoCalc"
                    checked={inputs.autoCalculateHotfix}
                    onCheckedChange={(checked) => updateInput("autoCalculateHotfix", checked)}
                  />
                </div>
              </div>

              {inputs.autoCalculateHotfix ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="hotfixReleases">Релизов хотфиксов в год</Label>
                    <Input
                      id="hotfixReleases"
                      type="number"
                      value={inputs.hotfixReleases}
                      onChange={(e) => updateInput("hotfixReleases", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotfixTasks">Задач в одном хотфиксе</Label>
                    <Input
                      id="hotfixTasks"
                      type="number"
                      value={inputs.hotfixTasksPerRelease}
                      onChange={(e) => updateInput("hotfixTasksPerRelease", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotfixHours">Часов на задачу</Label>
                    <Input
                      id="hotfixHours"
                      type="number"
                      value={inputs.hotfixHoursPerTask}
                      onChange={(e) => updateInput("hotfixHoursPerTask", Number(e.target.value))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="manualHotfix">Общие часы на хотфиксы и поддержку</Label>
                  <Input
                    id="manualHotfix"
                    type="number"
                    value={inputs.manualHotfixHours}
                    onChange={(e) => updateInput("manualHotfixHours", Number(e.target.value))}
                  />
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Итого часов на хотфиксы: <span className="font-semibold">{calculations.hotfixHours.toFixed(0)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">
                Итого базовый объём работ (без рисков):{" "}
                <span className="text-lg font-bold">{calculations.baseVolume.toFixed(0)} часов</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Календарь и производительность */}
        <Card>
          <CardHeader>
            <CardTitle>Календарь и производительность</CardTitle>
            <CardDescription>Параметры рабочего времени одного разработчика</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workDays">Рабочие дни в году</Label>
                <Input
                  id="workDays"
                  type="number"
                  value={inputs.workDaysPerYear}
                  onChange={(e) => updateInput("workDaysPerYear", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vacation">Отпуск (дней)</Label>
                <Input
                  id="vacation"
                  type="number"
                  value={inputs.vacationDays}
                  onChange={(e) => updateInput("vacationDays", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sick">Больничные и отгулы (дней)</Label>
                <Input
                  id="sick"
                  type="number"
                  value={inputs.sickDays}
                  onChange={(e) => updateInput("sickDays", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoursDay">Часов в рабочем дне</Label>
                <Input
                  id="hoursDay"
                  type="number"
                  value={inputs.hoursPerDay}
                  onChange={(e) => updateInput("hoursPerDay", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="productivity">Продуктивность разработчика: {inputs.productivityPercent}%</Label>
              </div>
              <Slider
                id="productivity"
                min={50}
                max={100}
                step={5}
                value={[inputs.productivityPercent]}
                onValueChange={([value]) => updateInput("productivityPercent", value)}
              />
              <p className="text-sm text-muted-foreground">
                Доля времени на полезную разработку (без встреч, созвонов и т.д.)
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Реальные рабочие дни:</strong> {calculations.realWorkDays} дней
              </p>
              <p className="text-sm">
                <strong>Брутто-часы в год:</strong> {calculations.bruttoHoursPerYear.toFixed(0)} часов
              </p>
              <p className="text-sm font-medium text-foreground">
                <strong>Эффективные часы разработки на одного разработчика в год:</strong>{" "}
                <span className="text-lg font-bold">{calculations.effectiveHoursPerDev.toFixed(0)} часов</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Риски задач */}
        <Card>
          <CardHeader>
            <CardTitle>Риски задач</CardTitle>
            <CardDescription>Учёт изменений требований, недооценки и инфраструктурных проблем</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="risk">Процент рисков на задачи и инфраструктуру: {inputs.riskPercent}%</Label>
              </div>
              <Slider
                id="risk"
                min={0}
                max={30}
                step={1}
                value={[inputs.riskPercent]}
                onValueChange={([value]) => updateInput("riskPercent", value)}
              />
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">
                Объём работ с учётом рисков:{" "}
                <span className="text-lg font-bold">{calculations.volumeWithRisks.toFixed(0)} часов</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Риски текучки */}
        <Card>
          <CardHeader>
            <CardTitle>Риски текучки команды</CardTitle>
            <CardDescription>Учёт потерь продуктивности при уходе разработчиков</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="turnover">Количество уходящих разработчиков в год</Label>
              <Input
                id="turnover"
                type="number"
                value={inputs.developersTurnover}
                onChange={(e) => updateInput("developersTurnover", Number(e.target.value))}
              />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-semibold">Параметры одного ухода:</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prodBefore">
                    Продуктивность в последнем месяце перед уходом: {inputs.productivityBeforeLeaving}%
                  </Label>
                  <Slider
                    id="prodBefore"
                    min={0}
                    max={100}
                    step={5}
                    value={[inputs.productivityBeforeLeaving]}
                    onValueChange={([value]) => updateInput("productivityBeforeLeaving", value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthsEmpty">Количество месяцев без человека (поиск)</Label>
                  <Input
                    id="monthsEmpty"
                    type="number"
                    step="0.5"
                    value={inputs.monthsWithoutPerson}
                    onChange={(e) => updateInput("monthsWithoutPerson", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prodOnboard">
                    Продуктивность в первом месяце новичка: {inputs.productivityOnboarding}%
                  </Label>
                  <Slider
                    id="prodOnboard"
                    min={0}
                    max={100}
                    step={5}
                    value={[inputs.productivityOnboarding]}
                    onValueChange={([value]) => updateInput("productivityOnboarding", value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Потери на одного разработчика:</strong> {calculations.turnoverLossesPerPerson.toFixed(0)} часов
              </p>
              <p className="text-sm font-medium text-foreground">
                <strong>Потери из-за текучки (всего в год):</strong>{" "}
                <span className="text-lg font-bold">{calculations.totalTurnoverLosses.toFixed(0)} часов</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Состав команды */}
        <Card>
          <CardHeader>
            <CardTitle>Состав команды</CardTitle>
            <CardDescription>Планируемое количество человеко-единиц разработки</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamSize">Количество разработчиков в команде</Label>
              <Input
                id="teamSize"
                type="number"
                value={inputs.plannedTeamSize}
                onChange={(e) => updateInput("plannedTeamSize", Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Тимлид, который реально пишет код, считается как 1 единица. Техдир — нет.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Итоги */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Итоги расчёта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Итоговая потребность (с рисками и текучкой)</p>
                <p className="text-2xl font-bold">{calculations.totalDemand.toFixed(0)} часов</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Мощность команды ({inputs.plannedTeamSize} чел.)</p>
                <p className="text-2xl font-bold">{calculations.teamCapacity.toFixed(0)} часов</p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg bg-primary/10 p-6">
              <div className="flex items-baseline justify-between">
                <p className="text-base font-medium">Нужно человеко-единиц разработки (FTE):</p>
                <p className="text-3xl font-bold text-primary">{calculations.fteNeeded.toFixed(2)}</p>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-base font-medium">Рекомендуемое округление:</p>
                <p className="text-3xl font-bold text-primary">{Math.ceil(calculations.fteNeeded)} разработчиков</p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border-2 p-4">
              <p className="text-base">
                <strong>При текущем планируемом составе команды ({inputs.plannedTeamSize} чел.) вы закрываете:</strong>
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: calculations.coveragePercent >= 100 ? "hsl(var(--chart-2))" : "#ef4444" }}
              >
                {calculations.coveragePercent.toFixed(1)}% работы
              </p>
            </div>

            {calculations.debtHours > 0 && (
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="text-base font-medium text-destructive">
                  Ожидаемый годовой долг:{" "}
                  <span className="text-2xl font-bold">{calculations.debtHours.toFixed(0)} часов</span>
                </p>
              </div>
            )}

            {calculations.coveragePercent >= 100 && (
              <div className="rounded-lg bg-green-500/10 p-4">
                <p className="text-base font-medium text-green-600 dark:text-green-400">
                  ✓ Команда справится с запланированным объёмом работ!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Визуализация */}
        <Card>
          <CardHeader>
            <CardTitle>Структура годовой нагрузки</CardTitle>
            <CardDescription>Распределение часов по типам работ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={loadStructureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-1))">
                  {loadStructureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Спрос vs мощность команды</CardTitle>
            <CardDescription>Сравнение потребности в часах и доступной мощности команды</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={demandVsCapacityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Потребность" fill="#ef4444" />
                <Bar dataKey="Мощность команды" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Прогноз долга в зависимости от размера команды</CardTitle>
            <CardDescription>Ожидаемый годовой долг при разном количестве разработчиков</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={debtScenarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="debt" fill="hsl(var(--chart-1))">
                  {debtScenarios.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.debt === 0 ? "hsl(var(--chart-2))" : entry.debt > 2000 ? "#ef4444" : "#f59e0b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
