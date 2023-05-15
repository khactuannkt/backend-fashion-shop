// const deleteToken=()={
// // //start cron-job
// // let scheduledJob = schedule.scheduleJob(`*/${process.env.EMAIL_VERIFY_EXPIED_TIME_IN_MINUTE} * * * *`, async () => {
// //     console.log('Deletion of unverified users begins');
// //     const foundUser = await User.findOneAndDelete({
// //         _id: user._id,
// //         isVerified: false,
// //     });
// //     scheduledJob.cancel();
// // });

// }
export default function handler(req, res) {
    console.log('test cron jobs');
}
