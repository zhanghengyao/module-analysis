// // gsdg
// const a = require('assert');
// // fuck
// module.exports = {
// 	name:{sex: () => 'test name'},
//     si: function*(){},
//     // nb
//   	ni: (a) => {
//       resizeBy()
//     },
//     // gan
//     gan(){
//       console.log('gan')
//     }
// }
const obj = {
  name: { sex: () => 'test name' },
  si: function* () {},
  // nb
  ni: (a) => {
    resizeBy();
  },
  // gan
  gan() {
    console.log('gan');
  },
};
exports.default = obj;

// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// const chair_1 = require("chair");
// class TipsManagerController extends chair_1.Controller {
//     async getTip() {
//         const { ctx } = this;
//         ctx.validate({
//             onPage: { type: 'string' },
//         }, ctx.query);
//         const { onPage } = ctx.query;
//         const tip = await ctx.service.tipsManager.getTipByOnPage(onPage);
//         ctx.body = tip;
//     }
// }
// exports.default = TipsManagerController;
