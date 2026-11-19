// const wrap = (title: string, body: string) => `
// <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
//   <div style="background:#d4a24c;color:#fff;padding:16px 24px"><h2 style="margin:0">🐾 StrayCare</h2></div>
//   <div style="padding:24px;color:#333">
//     <h3>${title}</h3>${body}
//     <p style="margin-top:32px;color:#888;font-size:12px">Be the voice for the voiceless.</p>
//   </div>
// </div>`;

// const btn = (url: string, label: string) =>
//   `<p><a href="${url}" style="background:#d4a24c;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">${label}</a></p>`;

// const client = () => process.env.CLIENT_URL;

// export const templates = {
//   welcome: (name: string) =>
//     wrap(`Welcome, ${name}!`, `<p>Thanks for joining StrayCare. Together we can help animals find a home.</p>${btn(client()!, "Visit StrayCare")}`),

//   rescuerApproved: (name: string) =>
//     wrap("Your rescuer account is approved", `<p>Hi ${name}, an admin approved your account. You can now log in.</p>${btn(`${client()}/login`, "Log in")}`),

//   rescuerRejected: (name: string) =>
//     wrap("Rescuer application update", `<p>Hi ${name}, unfortunately your rescuer application was not approved.</p>`),

//   reportReceived: (name: string) =>
//     wrap("Stray report received", `<p>Hi ${name}, thank you for reporting. Our team will review it shortly.</p>`),

//   reportStatus: (name: string, status: string) =>
//     wrap("Your report was updated", `<p>Hi ${name}, the status of your report is now <b>${status}</b>.</p>`),

//   adoptionRequested: (name: string, animal: string) =>
//     wrap("Adoption request received", `<p>Hi ${name}, we received your request to adopt <b>${animal}</b>. We'll get back to you soon.</p>`),

//   adoptionApproved: (name: string, animal: string) =>
//     wrap("Adoption approved 🎉", `<p>Congratulations ${name}! Your adoption of <b>${animal}</b> is approved. Your certificate is attached.</p>
//       <p>You agreed to submit a welfare check-in every 2 weeks for 6 months. We'll send you reminders.</p>`),

//   adoptionRejected: (name: string, animal: string) =>
//     wrap("Adoption request update", `<p>Hi ${name}, your request to adopt <b>${animal}</b> was not approved this time.</p>`),

//   followUpReminder: (name: string, animal: string, adoptionId: string) =>
//     wrap("Time for a welfare check-in", `<p>Hi ${name}, how is <b>${animal}</b> doing? Please submit a quick welfare update.</p>${btn(`${client()}/check-in/${adoptionId}`, "Submit check-in")}`),

//   donationReceipt: (name: string, amount: number) =>
//     wrap("Thank you for your donation", `<p>Hi ${name}, we received your donation of <b>LKR ${amount.toLocaleString()}</b>. It will help animals in need.</p>`),
// };