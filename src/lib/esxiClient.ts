'use server'

import { fetchWithClerk } from '@/utils/fetchConfig'

export async function getEsxiList() {
  try {
    const response = await fetchWithClerk(`${process.env.NEXT_PUBLIC_PY_ENDPOINT}/vms`)
    const data = await response.json()

    return {
      isSuccess: true,
      data,
    }
  } catch (err) {
    console.log('err', err)
    return {
      isSuccess: false,
      data: err,
    }
  }
}

type actionType = 'power_on' | 'power_off' | 'reboot'
export async function powerControlVm(
  vmName = 'centos-kube-node1',
  actionType: actionType = 'power_on'
) {
  try {
    const response = await fetchWithClerk(
      `${process.env.NEXT_PUBLIC_PY_ENDPOINT}/vms/${actionType}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vm_name: vmName,
        }),
      }
    )
    const data = await response.json()

    return {
      isSuccess: true,
      data,
    }
  } catch (err) {
    console.log('err', err)
    return {
      isSuccess: false,
      data: err,
    }
  }
}
