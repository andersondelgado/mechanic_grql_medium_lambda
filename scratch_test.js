const { spawn } = require('child_process');
const input = {
  "request": {
    "flows": [
      {
        "name": "workflow_taller",
        "steps": [
          {
            "name": "GestionTallerProd_stats",
            "functionName": "GestionTallerProd_stats",
            "actions": [
              {
                "action": "custom_function",
                "body": {}
              }
            ]
          }
        ]
      }
    ]
  }
};

const p = spawn('node', ['dist/lambda_garage.js'], { cwd: __dirname });
p.stdout.on('data', d => console.log('STDOUT:', d.toString()));
p.stderr.on('data', d => console.error('STDERR:', d.toString()));
p.on('close', code => console.log('Exited with code:', code));

p.stdin.write(JSON.stringify(input));
p.stdin.end();
