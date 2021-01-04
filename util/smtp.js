/*
 * @Description: This is a XX file
 * @Author: JeanneWu
 * @Date: 2020-12-28 23:29:07
 */
// js文件头部注释之后的内容
import {
    SmtpClient
} from "https://deno.land/x/smtp/mod.ts";
export const smtp = async function (mailOptions = {}) {
    const client = new SmtpClient();

    await client.connect({
        hostname: "smtp.163.com",
        port: 25,
        username: "monkey_master2020@163.com",
        password: "LWOQUYMFRSCIWZVK",
    });

    await client.send({
        from: "monkey_master2020@163.com",
        to: mailOptions.toAccount,
        subject: mailOptions.subject,
        content: mailOptions.content,
    });

    await client.close();
}
