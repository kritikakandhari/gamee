import { Activity, ShieldCheck, Trophy } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">Player</h1>
              <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/20">US</Badge>
              <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/20">Verified</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Profile + performance metadata hooks live here.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Profile</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">Connect Game</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Rating</CardTitle>
            <Trophy className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">1500</CardContent>
        </Card>
        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Win Rate</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">52%</CardContent>
        </Card>
        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Anti-cheat</CardTitle>
            <ShieldCheck className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">Enabled</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Matches</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Match history will be rendered here once the backend match history endpoint is ready.
        </CardContent>
      </Card>
    </div>
  )
}
