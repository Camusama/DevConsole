'use client'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
import { rebotTencent3Y } from '@/lib/tencentcloudClient'
import { toast } from 'sonner'

export const NavMenu = () => {
  const rebotTenct3Y = async () => {
    const { isSuccess, data } = await rebotTencent3Y()
    if (isSuccess) {
      toast.success('Rebot Success', {
        description: JSON.stringify(data),
      })
    } else {
      toast.error('Rebot Failed', {
        description: JSON.stringify(data),
      })
    }
  }
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Actions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} cursor-pointer`}
              onClick={rebotTenct3Y}
            >
              <span>
                Rebot <span className="font-semibold"> Tencent-3Y lhins-27vkwuua</span>
              </span>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
