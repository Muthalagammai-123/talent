import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notifications } from '@/data/mockData'

export function NotificationDropdown() {
  const unread = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative text-[hsl(var(--muted-foreground))]">
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#cc1016] px-1 text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 w-80 rounded-lg border border-[#e0e0e0] bg-white p-1 shadow-lg dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]"
          sideOffset={8}
          align="end"
        >
          <p className="px-3 py-2 text-sm font-semibold">Notifications</p>
          {notifications.map((n) => (
            <DropdownMenu.Item
              key={n.id}
              className="cursor-pointer rounded-sm px-3 py-2.5 outline-none hover:bg-[#f3f2ef] focus:bg-[#f3f2ef] dark:hover:bg-[hsl(var(--muted))]"
            >
              <p className={`text-sm ${!n.read ? 'font-semibold text-[hsl(var(--foreground))]' : 'font-medium'}`}>
                {n.title}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{n.body}</p>
              <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{n.time}</p>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
