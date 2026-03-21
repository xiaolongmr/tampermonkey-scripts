// 获取并解析__NEXT_DATA__中的user_id
try {
  // 获取script标签
  const nextDataScript = document.getElementById('__NEXT_DATA__');
  
  if (nextDataScript) {
    // 解析JSON数据
    const nextData = JSON.parse(nextDataScript.textContent);
    
    // 提取user_id
    const userId = nextData.props.initStore.user.user_id;
    
    console.log('✅ user_id 获取成功:');
    console.log('user_id:', userId);
    
    // 同时显示其他用户信息
    console.log('\n📋 用户其他信息:');
    console.log('用户名:', nextData.props.initStore.user.username);
    console.log('邮箱:', nextData.props.initStore.user.email);
    console.log('注册时间:', new Date(nextData.props.initStore.user.created_at * 1000).toLocaleString());
    
  } else {
    console.error('❌ 未找到__NEXT_DATA__ script标签');
  }
} catch (error) {
  console.error('❌ 获取user_id失败:', error.message);
}