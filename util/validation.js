/*
 * @Description: 验证规则
 * @Author: JeanneWu
 * @Date: 2020-12-16 23:16:41
 */


/**
 * @description: 验证skuids
 * @param {*} skuids
 * @return {*}
 */
export function validateSkuids(skuids) {
    skuids.forEach((itemId) => {
        if (!/^100/.test(itemId)) {
            skuids = prompt(
                "请输入100开头的抢购skuid,可以是多个，以逗号(,)分割",
                "100016691566"
            ).split(",");
            validateSkuids(skuids);
        }
    });
}
