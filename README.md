# YMLA

## How to run this program

* First step <br>
Download docker click [here](https://www.docker.com/)

* Second step<br>
Clone this project to your device<br>
`git clone https://github.com/Msiciots/ymla.git`<br>

* Third step<br>
Connect to [YMLA](https://cosbi7.ee.ncku.edu.tw/YMLA/download) and download all datasets, decompression and place in `/static` directory, like this `/static/data`.
![down](https://user-images.githubusercontent.com/86098705/191693298-200aab61-0b1e-4792-9746-9b1e9190ce31.PNG)

* Fourth step<br>
To run the docker container, you must builds Docker images from a Dockerfile first.


`docker build . -t ymla`


And you can create a writeable container layer over the specified image, and then starts it using the specified command.<br>

for example, run this program at your PC port 6500 and mapping to Docker container port 6500

`docker run -dp 6500:6500 ymla`

Open browser , and type http://127.0.0.1:6500/YMLA

