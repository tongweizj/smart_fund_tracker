var async = require('async')
const logger = require('../utils/log')
const DB = require('../graphql/fund-history')
const myHoldDB = require('../graphql/my-holds')
/// 将数据上传Mongo 服务器
function saveToMongo(funds,myHolds) {
  console.log('-----------saveToMongo-----------------')
  console.log(funds)
  console.log(myHolds)
  var waitListLength = 0
  async.mapLimit(
    funds,
    1,
    function (fund, callback) {
      // 1) 上传基金历史价格
      console.log('fund')
      console.log(fund)
      DB.updateFundHistory(fund, function (resp) {
        console.log(resp)
        // 如果不存在,就添加到创建的 waitlist
        if (resp.updateFundHistory != null) {
          logger.log('info', waitListLength + '. Update Fund:' + fund[6], {
            label: 'save2Mongo'
          })
          waitListLength++
          callback(null, fund)
          // console.log(resp.fundByCode)
        } else {
          logger.log(
            'error',
            waitListLength + '. Fund had Updated:' + fund[6],
            {
              label: 'save2Mongo'
            }
          )
          waitListLength++
          callback(null, '')
        }
      })
      // TODO 2) 更新基金的涨幅记录

      var holdingIncome=[fund[6],{
        "lastday": (parseFloat(fund[1])*parseFloat(fund[3]))/(100+parseFloat(fund[3])),
        "lastdayRate": parseFloat(fund[3]),
        "total": parseFloat(fund[1])*myHolds[fund[6]]['amount'],
        "totalRate": (parseFloat(fund[1])/myHolds[fund[6]]['cost']-1)
      }]
     
      myHoldDB.updateHoldingIncome(holdingIncome, function (resp) { 
        console.log('fanhui')
        console.log(resp)})
    },
    function (err, results) {
      console.log('disan')
      console.log(err)
      console.log(results)
      // 2) 创建新基金和涨幅记录
    }
  )
}
module.exports = saveToMongo

// {
//   "data": {
//     "updateFundHistory": {
//       "code": "920925",
//       "historty": [
//         {
//           "date": "2021-01-22",
//           "nav": 1.4042,
//           "cnw": 3.0353,
//           "changeRate": -0.75,
//           "openBuy": true,
//           "openSell": true
//         }
//       ]
//     }
//   }
// }

// Error:
// Variable "$update" got invalid value "2.2409" at "update.nav";
// Float cannot represent non numeric value: "2.2409": {"response":{"errors":[{"message":"Variable \"$update\" got invalid value \"2.2409\" at \"update.nav\"; Float cannot represent non numeric value: \"2.2409\"","locations":[{"line":2,"column":30}]},{"message":"Variable \"$update\" got invalid value \"2.2409\" at \"update.cnw\"; Float cannot represent non numeric value: \"2.2409\"","locations":[{"line":2,"column":30}]},{"message":"Variable \"$update\" got invalid value \"-0.77\" at \"update.changeRate\"; Float cannot represent non numeric value: \"-0.77\"","locations":[{"line":2,"column":30}]}],"status":500},"request":{"query":"\n    mutation($code: String!, $update: FundHistoryInput) {\n      updateFundHistory(code: $code, update: $update) {\n        code\n        historty {\n          date\n          nav\n          cnw\n          changeRate\n          openBuy\n          openSell\n        }\n      }\n    }\n  ","variables":{"code":"005267","update":{"date":"2021-01-22","nav":"2.2409","cnw":"2.2409","changeRate":"-0.77","openBuy":true,"openSell":false}}}}
