

export const getLogin = async(req,res)=>{
     return res.render('user/login')
}

export const logout =(req,res)=>{
     req.session.destroy(()=>{
          res.redirect('user/login')
     })
}

export const getsignup = async(req,res)=>{
     return res.render('user/signup')
}

export const getOtp=(req,res)=>{
     res.render('user/verifyOtp')
}

export const getHome=async(req,res)=>{
  if (!req.session.user) {
    return res.redirect('/user/login');
  }

  return res.render('user/homepage');
};