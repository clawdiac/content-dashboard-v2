'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Layers } from 'lucide-react'

interface Props {
  onNext: () => void
  onBack: () => void
}

export function StepAssets({ onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Assets</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Attach brand assets or style references to apply during generation.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Asset integration coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll be able to attach style references, brand guidelines, and clothing assets here.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  )
}
