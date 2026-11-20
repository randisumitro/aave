from setuptools import setup, find_packages

setup(
    name="aave-backend",
    version="1.0.0",
    description="AAVE Autonomous AI Video Editor Backend",
    author="Randi Sumitro",
    author_email="136390141+randisumitro@users.noreply.github.com",
    url="https://github.com/randisumitro/aave",
    license="MIT",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn>=0.24.0",
        "pydantic>=2.5.0",
        "websockets>=12.0",
        "python-multipart>=0.0.6",
        "httpx>=0.25.0",
    ],
    entry_points={
        "console_scripts": [
            "aave-backend=main:app",
        ],
    },
    python_requires=">=3.11",
)
