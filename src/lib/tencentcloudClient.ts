'use server'
import * as tencentcloud from 'tencentcloud-sdk-nodejs-lighthouse'
// import { loadEnvConfig } from '@next/env'

// const projectDir = process.cwd()
// loadEnvConfig(projectDir)

const createClient = () => {
  const LighthouseClient = tencentcloud.lighthouse.v20200324.Client

  const SECRET_ID = process.env.TENCENTCLOUD_SECRET_ID as string
  const SECRET_KEY = process.env.TENCENTCLOUD_SECRET_KEY as string

  // 实例化要请求产品的client对象,clientProfile是可选的
  const client = new LighthouseClient({
    credential: {
      secretId: SECRET_ID,
      secretKey: SECRET_KEY,
    },
    region: 'ap-shanghai',
    profile: {
      httpProfile: {
        endpoint: 'lighthouse.tencentcloudapi.com',
      },
    },
  })
  return client
}
export const rebotTencent3Y = async () => {
  const client = createClient()
  try {
    const data = await client.RebootInstances({
      InstanceIds: ['lhins-27vkwuua'],
    })
    return {
      isSuccess: true,
      data,
    }
  } catch (err) {
    return {
      isSuccess: false,
      data: err,
    }
  }
}
// client
//   .RebootInstances({
//     InstanceIds: ['lhins-27vkwuua'],
//   })
//   .then(
//     (data: any) => {
//       console.log(data)
//     },
//     (err: Error) => {
//       console.error('error', err)
//     }
//   )
