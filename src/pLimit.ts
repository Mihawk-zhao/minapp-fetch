const pLimit = require('./utils/pLimit')



function fetchPLimit(pArray: Promise<any>[], plimit: number = 10): Promise<any[]>{
  return new Promise((resolve, reject)=>{
    let limit = pLimit(plimit)
    let input = []

    if(pArray.length === 0){
      reject(`pLimit参数有误`)
    }

    for(let i = 0; i < pArray.length; i++){
      input.push(limit(() => pArray[i]))
    }

    Promise.all(input).then((res: any) => {
      resolve(res)
    }, (err: any) => {
      reject(err)
    })

  })
}


export default fetchPLimit