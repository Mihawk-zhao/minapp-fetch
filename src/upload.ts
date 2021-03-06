/*
 * @Author: your name
 * @Date: 2020-05-18 18:02:23
 * @LastEditTime: 2020-06-06 08:58:58
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /@ownpack/weapp/src/fetch/file/upload.ts
 */ 

import { getBaaSF } from './utils/utils'
import {IFileParams, IMetaData, IGetFileRes} from './index'
import {PLATFORM_NAME_BAAS, PLATFORM_NAME, PLATFORM_ALL, PLATFORM_NAME_MONGO_SERVER} from './constants/constants'
import {WEBAPI_OPTIONS_ERROR, METHOD_NOT_SUPPORT} from './constants/error'


function fetchUpload(fileParams: IFileParams, metaData: IMetaData): Promise<IGetFileRes>{
  let { BaaS_F, minapp, options } = getBaaSF()

  return new Promise((resolve, reject)=>{
    if(PLATFORM_NAME_BAAS.indexOf(minapp) > -1){
      if(minapp === PLATFORM_NAME.ZX_CLOUD){
        let MyFile = new BaaS_F.File()
        MyFile.upload(fileParams, metaData).then((res: IGetFileRes) => {
          // 上传成功
          resolve(res)
        }, (err: any) => {
          // HError 对象
          reject(err)
        })
      }

      let MyFile = new BaaS_F.File()
      MyFile.upload(fileParams, metaData).then((res: IGetFileRes) => {
        // 上传成功
        resolve(res)
      }, (err: any) => {
        // HError 对象
        reject(err)
      })
    }


    //MongoDB
    if(PLATFORM_NAME_MONGO_SERVER.indexOf(minapp) > -1){
      if(minapp === PLATFORM_NAME.MONGODB){
        throw new Error(`minapp.upload ${METHOD_NOT_SUPPORT}`)
      }
      if(minapp === PLATFORM_NAME.WX_WEAPP){
        let tempFileName = new Date().getTime() + fileParams.filePath.match(/\.[^.]+?$/)[0]
        BaaS_F.uploadFile({
          filePath: fileParams.filePath,
          cloudPath: metaData.categoryName + '/' + (metaData.fileName ? metaData.fileName : tempFileName) 
        }).then(res => {
          resolve(res)
        }, (err: any) => {
          reject(err)
        })
      }
      if(minapp === PLATFORM_NAME.WX_CLOUD){
        BaaS_F.uploadFile({
          fileContent: fileParams.fileObj,
          cloudPath: metaData.categoryName + '/' + metaData.fileName
        }).then(res => {
          resolve(res)
        }, (err: any) => {
          reject(err)
        })
      }
    }

    

    //webapi
    if(minapp === PLATFORM_NAME.ZX_WEBAPI){
      if(!options) throw new Error(WEBAPI_OPTIONS_ERROR)
      BaaS_F({
        method: 'post',
        url: `${options.RequestBase}/hserve/v2.1/upload/`,
        headers: options.Header,
        data: metaData
      }).then((res: any) => {
        let tempA = res.data
        let formdata = new FormData()
        formdata.append('file', fileParams.fileObj)
        BaaS_F({
          method: 'post',
          url: tempA.upload_url,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          data: {
            authorization: tempA.authorization,
            file: formdata,
            policy: tempA.policy
          }
        }).then((res2: any) => {
          let result: IGetFileRes = {
            data: {
              categories: {
                id: metaData.categoryID,
                name: metaData.categoryName
              },
              created_at: res2.data.time,
              id: tempA.id,
              mime_type: res2.data.mimetype,
              name: tempA.name,
              path: tempA.path,
              size: res2.data.file_size
            }
          }
          resolve(result)
        }).catch((err: any) => {
          reject(err)
        })
      }).catch((err: any) => {
        reject(err)
      })
    }

    //op 运营后台
    if(minapp === PLATFORM_NAME.ZX_OP){
      let params: any = {
        fileObj: fileParams.fileObj,
        filename: metaData.fileName,
        categoryID: metaData.categoryID,
      }
      BaaS_F.post('https://cloud.minapp.com/userve/v2.1/upload/', {
        filename: params.filename,
        category_id: params.categoryID
      }).then((res: any) => {
        let temp = res.data
        let formData = new FormData()
        formData.append('file', params.fileObj)
        formData.append('policy', temp.policy)
        formData.append('authorization', temp.authorization)
        let axiosUp = require('axios')
        axiosUp.post(temp.upload_url, formData, {
          'headers': {'Content-Type': 'multipart/form-data'},
        }).then((res: any)=>{
          resolve({
            data: {
              path: temp.path,
              id: temp.id,
              name: temp.name,
              cdn_path: temp.cdn_path,
              created_at: temp.created_at,
            }
          })
        }).catch((err: any) => {
          reject(err)
        })
      }).catch((err: any) => {
        reject(err)
      })
    }
    if(PLATFORM_ALL.indexOf(minapp) === -1){
      throw new Error(`minapp.upload ${METHOD_NOT_SUPPORT}`)
    }
  })
}


export default fetchUpload