<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <title>Highcharts Chart - SDN News</title>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <style>
        #container { height: 400px; max-width: 800px; margin: 0 auto; }
        .button-row { text-align: center; margin-top: 20px; }
        button { padding: 10px 20px; cursor: pointer; }
    </style>
</head>
<body>
    <div id="container"></div>
    <div class="button-row">
        <button id="large">Large</button>
        <button id="small">Small</button>
    </div>
    <script>
        const chart = Highcharts.chart('container', {
            title: { text: 'Highcharts responsive chart' },
            series: [{
                name: 'Data 1',
                data: [1, 4, 3, 4, 2]
            }, {
                name: 'Data 2',
                data: [6, 4, 2, 1, 3]
            }]
        });
        document.getElementById('small').addEventListener('click', () => { chart.setSize(400, 300); });
        document.getElementById('large').addEventListener('click', () => { chart.setSize(600, 300); });
    </script>
</body>
</html>

