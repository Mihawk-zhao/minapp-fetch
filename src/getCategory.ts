/*
 * @Author: your name
 * @Date: 2020-01-23 18:19:36
 * @LastEditTime: 2020-06-06 08:53:00
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /minapp-fetch/src/fetch/content/getCategory.ts
 */

import { getBaaSF } from './utils/utils'
import {PLATFORM_NAME_BAAS, PLATFORM_NAME} from './constants/constants'
import {WEBAPI_OPTIONS_ERROR} from './constants/error'

function fetchGetCategory(contentGroupID: number, categoryID: number): Promise<any>{
  let {BaaS_F, minapp, options} = getBaaSF()

  if(PLATFORM_NAME_BAAS.indexOf(minapp) > -1){
    if(minapp === PLATFORM_NAME.CLOUD){
      return new Promise<any>((resolve: any, reject: any)=>{
        let MyContentCategory = new BaaS_F.ContentCategory(contentGroupID)
        MyContentCategory.get(categoryID).then((res: any) => {
          // success
          resolve(res)
        }, (err: any) => {
          // err
          reject(err)
        })
      })
    }
    return new Promise<any>((resolve: any, reject: any)=>{
      let MyContentGroup = new BaaS_F.ContentGroup(contentGroupID)
      MyContentGroup.getCategory(categoryID).then((res: any) => {
        // success
        resolve(res)
      }, (err: any) => {
        // err
        reject(err)
      })
    })
  }

  //webapi
  if(minapp === PLATFORM_NAME.WEBAPI){
    return new Promise<any>((resolve, reject)=>{
      if(!options) throw new Error(WEBAPI_OPTIONS_ERROR)
      BaaS_F({
        method: 'get',
        url: `${options.RequestBase}/hserve/v2.2/content/category/${categoryID}/`,
        headers: options.Header,
        params: {
          content_group_id: contentGroupID
        }
      }).then((res: any) => {
        resolve(res)
      }).catch((err: any) => {
        reject(err)
      })
    })
  }

  //op 运营后台
  if(minapp === PLATFORM_NAME.OP){
    return new Promise<any>((resolve, reject)=>{
      BaaS_F.get(`https://cloud.minapp.com/userve/v2.2/content/${contentGroupID}/category/${categoryID}/`).then((res: any) => {
        resolve(res)
      }).catch((err: any)=>{
        reject(err)
      })
    })
  }

  return new Promise<any>((resolve, reject)=>{
    resolve({})
  })
}

export default fetchGetCategory