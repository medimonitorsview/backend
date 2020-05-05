const express = require('express')
const app = express()
const bodyParser = require('body-parser');

const port = process.env.PORT || 8080
app.use(bodyParser.text({type: '*/*'}))
app.post('/', (req, res) => {
    console.log(req.body)
    res.json({ status: 'Ok' });
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))