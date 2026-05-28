// ================= EMAILJS CONFIG =================

// Initialize EmailJS

emailjs.init("jgmvmhq4W0cVkU2Cl");


// ================= SEND OTP EMAIL FUNCTION =================

export async function sendOTP(email, otp) {

  const templateParams = {
    to_email: email,
    otp_code: otp
  };

  try {

    const response = await emailjs.send(
      "service_8jxegvi",
      "template_0nyobne",
      templateParams
    );

    console.log("OTP Email Sent!", response);

    return true;

  } catch (error) {

    console.error("Email Error:", error);

    return false;
  }
}