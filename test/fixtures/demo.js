/**
 * 移动端的 fillinfo 的 controller
 * @type {[type]}
 */
module.exports = app => {
  return class MobileFillInfoController extends app.BaseController {

    /**
     * 填写信息
     */
    async commitInfo() {
      const { ctx, loginPeopleId, service: sensitiveWordService } = this.varBootstrap;
      const peopleId = loginPeopleId;
      if (name) {
        const sensitiveRet = await sensitiveWordService
          .checkSensitiveWord(name, 'name', account_type, a.b.v());
        // if (sensitiveRet.sensitive) {
        //   this.statService.sendStat('node', {
        //     tag: 'mobile_register_process_sensitive',
        //     type: sensitiveRet.message,
        //     sensitiveType: sensitiveRet.sensitiveType,
        //     peopleId,
        //     email,
        //     name,
        //   });
        //   return ctx.errorRes(sensitiveRet.message, 20000);
        // }
      }
    }
  };
};
