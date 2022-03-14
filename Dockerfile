FROM python:3.8
COPY . /YMLA
WORKDIR /YMLA
RUN ["pip3", "install", "-r", "requirements.txt"]
CMD ["python3", "manage.py", "runserver", "0.0.0.0:6500"]