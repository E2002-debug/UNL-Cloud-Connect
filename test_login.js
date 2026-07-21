const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:8000/api/auth/login', {
      username: 'isabel.morocho@unl.edu.ec',
      password: 'somepassword'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(res.data);
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
})();
