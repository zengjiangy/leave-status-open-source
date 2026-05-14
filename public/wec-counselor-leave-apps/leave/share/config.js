/**
 * ============================================
 *  配置文件 - 所有可修改的内容都在这里
 * ============================================
 */
const CONFIG = {
    // ========== 状态栏配置 ==========
    statusText: "正在休假中",
    statusSubText: "审批已通过",
    statusType: "success",
    statusSwitchAtBeijing: "",
    upcomingStatusEnabled: false,
    upcomingSwitchAtBeijing: "",
    completedStatusEnabled: false,
    completedSwitchAtBeijing: "",
    optionalVisibilityEnabled: false,
    visibleFields: {
        leaveType: true,
        needLeaveSchool: true,
        cancelRule: true,
        actualVacationTime: true,
        startTime: true,
        endTime: true,
        approvalFlow: true,
        emergencyContact: true,
        approver: true,
        leaveReason: true,
        location: true,
        ccPerson: true,
        destination: true,
        dormInfo: true,
        attachments: true,
        approvedStamp: true,
        disclaimer: true,
        service: true,
        completionInfo: true,
        completionStatus: true,
        completionAttachments: true,
        completionLocation: true
    },

    // ========== 个人信息（头像卡片） ==========
    userName: "示例学生",
    userAvatarText: "示例",
    userId: "学生2026000000",
    avatarBgColor: "#3399ff",

    // ========== 个人信息弹窗 ==========
    personalInfo: {
        photo: "-",
        name: "示例学生",
        studentId: "2026000000",
        gender: "男",
        grade: "2026",
        college: "示例学院",
        major: "示例专业",
        className: "2026级示例专业1班",
        dorm: "-"
    },

    // ========== 请假信息 ==========
    leaveType: "离校",
    needLeaveSchool: "是",
    needLeaveSchoolUseCancelRuleColor: false,
    cancelRuleText: "离校请假需要销假，非离校请假无需销假",
    cancelRuleColor: "#f4a11a",
    actualVacationTime: "-",

    // ========== 请假申请详情 ==========
    startTime: "04-27 18:00",
    endTime: "04-30 18:00",
    durationText: "3天",
    approvalFlow: "共1步",
    emergencyContact: "",
    showEmergencyContact: false,
    approver: "示例审批人",
    leaveReason: "示例请假原因",
    locationText: "中国北京市海淀区示例地点",
    locationUrl: "https://example.com/wec-counselor-leave-apps/leave/share/index.html?id=00000000000000000000000000000000&needApproval=1#/map/116.397128/39.916527/中国北京市示例地点",
    ccPerson: "无",
    destination: {
        enabled: false,
        province: "北京市",
        city: "北京市",
        county: "海淀区",
        detail: "示例地址1号"
    },
    dormInfo: "-",
    attachments: [],
    completionInfo: {
        enabled: false,
        showAtBeijing: "",
        statusText: "\u5df2\u5b8c\u6210",
        statusActionText: "\u67e5\u770b\u5ba1\u6838\u8f68\u8ff9 >",
        statusActionUrl: "",
        inheritLeaveLocation: true,
        locationText: "",
        locationUrl: "",
        attachments: [],
        approvalFlow: {
            title: "\u9500\u5047\u5ba1\u6279\u6d41\u7a0b",
            confirmText: "\u77e5\u9053\u4e86",
            firstStep: {
                actor: "",
                actionText: "\u53d1\u8d77\u7533\u8bf7",
                timeText: "",
                opinion: "",
                theme: "primary"
            },
            secondStep: {
                actor: "",
                actionText: "\u5df2\u5b8c\u6210",
                timeText: "",
                opinion: "\u65e0",
                theme: "success"
            }
        }
    },

    // ========== 审批通过印章 ==========
    showApprovedStamp: true,
    stampDate: "",

    // ========== 销假规则弹窗 ==========
    cancelRule: {
        startTime: "2022-06-16 14:06:56",
        operator: "admin"
    },

    // ========== 底部免责声明 ==========
    disclaimerText: "本人承诺填写的信息真实有效，并对本次提交请假申请的信息真实性负责。",

    // ========== 链接配置 ==========
    serviceUrl: "https://example.com/support"
};
