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
      const { ctx, requestBody, loginPeopleId } = this.varBootstrap;
      const peopleId = loginPeopleId;

      const {
        account_type,
        op_type,
        email,
        opt_pan_card_number,
        opt_name,
        opt_phone,
        opt_occupation,
        name,
        field,
        second_category,
        opt_registration_number,
        opt_show_reference_url,
        identity_type,
        degree_of_completion,
        media_address,
        blog_address,
        publish_article_address,
        // 增加force,用于强制提交
        force,
        opt_pan_card_photo,
        // 20180503 新增社媒字段 dser
        linkedin_address,
        facebook_address,
        youtube_address,
        instagram_address,
        twitter_address,
      } = requestBody;

      /*
       * 如果有 name 用户名敏感词检验 add by @欧阳炳成
       * 敏感词检测分为大V敏感词以及敏感五害词，两者都要在注册账号的时候检测
       */
      if (name) {
        const sensitiveRet = await this.sensitiveWordService
          .checkSensitiveWord(name, 'name', account_type);
        if (sensitiveRet.sensitive) {
          this.statService.sendStat('node', {
            tag: 'mobile_register_process_sensitive',
            type: sensitiveRet.message,
            sensitiveType: sensitiveRet.sensitiveType,
            peopleId,
            email,
            name,
          });
          return ctx.errorRes(sensitiveRet.message, 20000);
        }
      }
    }
  };
};
