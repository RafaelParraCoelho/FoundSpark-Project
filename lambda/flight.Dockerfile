FROM public.ecr.aws/lambda/python:3.12

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY flight_handler.py ${LAMBDA_TASK_ROOT}

CMD ["flight_handler.lambda_handler"]
