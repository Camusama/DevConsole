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
import { powerControlVm } from '@/lib/esxiClient'

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

  const powerControlFn = async (vmName = 'centos-kube-node1') => {
    const { isSuccess, data } = await powerControlVm(vmName, 'reboot')
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
  const rebot146 = async () => {
    return await powerControlFn('CentOS7-v2board')
  }
  const rebootWRT = async () => {
    return await powerControlFn('OpenWRT-2025')
  }
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Actions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} cursor-pointer`}
              onClick={() => rebot146()}
            >
              <span>
                Reboot <span className="font-semibold"> V2board-146</span>
              </span>
            </NavigationMenuLink>
            <br />
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} cursor-pointer`}
              onClick={() => rebootWRT()}
            >
              <span>
                Reboot <span className="font-semibold"> OpenWRT</span>
              </span>
            </NavigationMenuLink>
            <NavigationMenuLink
              className={`${navigationMenuTriggerStyle()} cursor-pointer`}
              onClick={rebotTenct3Y}
            >
              <span>
                Reboot <span className="font-semibold"> Tencent-3Y lhins-27vkwuua</span>
              </span>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
