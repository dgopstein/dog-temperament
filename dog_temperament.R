library(data.table)
library(ggplot2)
library(viridis)
library(ggridges)
library(tidyr)
library(Hmisc)

setwd(dirname(rstudioapi::getActiveDocumentContext()$path))

dogs <- data.table(read.csv("dog_temperament.csv", header=TRUE))
#colnames(dogs) <-  c("dog", "total", "pass", "fail")
dogs[, lower.conf := binconf(pass, total, alpha=0.2)[, 'Lower']]
dogs[, upper.conf := binconf(pass, total, alpha=0.2)[, 'Upper']]
dogs[, point.est  := binconf(pass, total, alpha=0.2)[, 'PointEst']]
dogs[, confidence := 1 - (upper.conf - lower.conf)]
dogs$dog.by.upper.conf <- factor(dogs$dog, levels=dogs[order(upper.conf), dog])
dogs$dog.by.lower.conf <- factor(dogs$dog, levels=dogs[order(lower.conf), dog])
dogs$dog.by.point.est  <- factor(dogs$dog, levels=dogs[order(point.est), dog])


box.width<-0.015
ggplot(dogs[total>0][order(-point.est)][200:220], aes(dog.by.lower.conf, lower.conf)) +
  geom_segment(aes(y=min(lower.conf), yend=lower.conf,
                   x=dog.by.lower.conf, xend=dog.by.lower.conf),
               lwd=0.1) +
  geom_boxplot(stat="identity", aes(ymin=lower.conf, ymax=upper.conf,
                                    middle=upper.conf,
                                    lower=lower.conf, upper=lower.conf+2*box.width,
                                    #width=log(2*(1-confidence))*.35,
                                    fill=lower.conf),
               varwidth=TRUE, lwd=0.5) +
  scale_fill_viridis(option="plasma") +
  #scale_color_viridis(option="plasma") +
  theme_classic() +
  coord_flip()

dogs[dog=="Bull Terrier (miniature)",]
dogs[dog=="Belgian Malinois",]
dogs[dog=="French Bulldog",]


n<-100

total.dog <- dogs$dog[do.call(c, mapply(function(dog, total) rep(dog, each=total+1), dogs$dog, dogs$total))]
total.x <- do.call(c, mapply(function(dog, total) seq(0, 1, length.out=total+1), dogs$dog, dogs$total))

dogs.scaled <- data.table(dog = total.dog, x = total.x)
dogs.scaled <- merge(dogs.scaled, dogs, by="dog", all.x=TRUE)
dogs.scaled[, binom := dbinom(round(x*(total)), total, prob=pass/total)]

ggplot(dogs.scaled[dog%in%rev(levels(dogs$dog.by.lower.conf))[1:50]], # [seq(1, 240, by=6)]],
       aes(x, dog.by.lower.conf, height=binom*sqrt(total*confidence), fill=..x..)) +
  geom_density_ridges_gradient(stat="identity") +
  lims(x=c(.5,1)) +
  guides(fill=FALSE)

dogs.scaled


pdf.binconf.wide <- function(pass, total) {
  probs <- data.table(p = seq(0, 1, by=.01))
  probs[, lower := sapply(p, function(p) binconf(pass, total, p)[2])]
  probs[, upper := sapply(p, function(p) binconf(pass, total, p)[3])]
  probs
}

pdf.binconf <- function(pass, total) {
  as.data.table(tidyr::gather(pdf.binconf.wide(pass, total), bound.type, bound, lower:upper, factor_key=FALSE))
}

ggplot(pdf.binconf(8, 10), aes(bound, p)) + geom_line()

ggplot(aes(bound, p), data=data.frame()) +
  geom_line(data=pdf.binconf(8, 10), color="blue") +
  geom_line(data=pdf.binconf(80, 100), color="red") +
  lims(x = c(0,1)) +
  annotate("text",0.15, 0.85,  size=15, hjust=0, color="black", label="pass/fail") +
  annotate("text",0.2, 0.65, size=15, hjust=0, color="blue", label="8/10") +
  annotate("text",0.2, 0.5,  size=15, hjust=0, color="red", label="80/100")

ggplot(pdf.binconf.wide(8, 10)[, .(p, bound = upper-lower)], aes(bound, p)) + geom_line()

pdf.diff <- pdf.binconf(80,100)[order(bound)][, diff := diff(bound)]

ggplot(pdf.diff, aes(bound, 1-diff)) + geom_line()

ggplot(pdf.binconf(8,10)[, .(p, bound = ifelse(bound.type=='lower', .8-bound, bound-.8))][, .(p, bound, diff = diff(bound))]) +
  geom_line(aes(bound, 1-diff))

inverse <- function (f, lower = -100, upper = 100) {
  function (y) uniroot((function (x) f(x) - y), lower = lower, upper = upper)[1]
}

binconf.lower <- function(pass, total, alpha=0.8) binconf(pass, total, alpha)[2]
binconf.upper <- function(pass, total, alpha=0.8) binconf(pass, total, alpha)[3]

inverse.binconf.lower <- function(lower.bound, total, alpha=0.8) {
  unlist(inverse(function(pass) binconf.lower(pass, total, alpha), 0, total)(lower.bound))
}


binconf.lower(8, 10)

inverse.binconf.lower.lower(0.4, 10, alpha=.5)

inverse.binconf.lower.data <- data.table(p = seq(0.01, 0.99, by=.01))[, .(p, pass = sapply(p, function(x) inverse.binconf.lower(x, 10)))]
ggplot(data=inverse.binconf.lower.data) + geom_line(aes(x=p, y=pass-10*p))

### integration ###
pdf.binconf(8, 10)
pdf.diff[!is.nan(bound), pracma::trapz(bound, p)]

binom.dt <- data.table(x = seq(0,1,by=0.001))[, .(x, y=dbinom(1000*x, size=1000,prob=9.8/10))]
ggplot(binom.dt) + geom_line(aes(x,y))

?dbinom


#### Continuous Binomial ####
continuous.binom <- function(x, n, p) {
    ifelse(x <= 0, 0,
           ifelse(x > (n+1), 1,
    zipfR::Ibeta(p, x, n+1, lower=FALSE) /
      zipfR::Ibeta(0, x, n+1-x, lower=FALSE)))
}

continuous.binom <- function(x, n, p) {
  p <- min(p, 0.999999999)
  
  ifelse(x <= 0, 0,
         ifelse(x > (n+1), 1,
                zipfR::Ibeta(p, x, n+1, lower=FALSE) /
                  zipfR::Cbeta(x, n+1-x)))
}

zipfR::Ibeta(.1, 1, 2, lower=FALSE)
zipfR::Ibeta(.1, 1, 2, lower=TRUE)

zipfR::Ibeta(1, 2, 1, lower=FALSE)
zipfR::Ibeta(1, 2, 1, lower=TRUE)

zipfR::Cbeta(1, 2)
?zipfR::Ibeta

continuous.binom(8, 10, .8)
binom.dt <- data.table(x = seq(0,10,length.out=1000))[, .(x, y=continuous.binom(x, 10, .9))]
ggplot(binom.dt) + geom_line(aes(x,y))

plot.continuous.binom <- function(n, p) {
  is.upper <- p > 0.5
  dput(is.upper)
  cb <- if(is.upper) {
    function(x) continuous.binom(n-x, n-1, 2*(1-p))
  } else {
    function(x) continuous.binom(x, n-1, 2*p)
  }
  
  ggplot(data = data.frame(x = 0), mapping = aes(x = x)) + xlim(0,n) +
    stat_function(fun = cb)
}

continuous.binom(10, 10, 1)

plot.continuous.binom(10, .1)

ggplot(data.frame(sample = rbinom(50000, 4, 0.25)), aes(sample)) + geom_histogram(bins = 4) + xlim(0,4)

########## Regularized Beta Function #############
n.samples <- 15
binom.rbeta.cdf <- function(k,p=.5,n=10) (1-zipfR::Rbeta(p, k+1, n-k))
pdf.rbeta <- data.table(x = seq(0,n.samples,length.out = 1000))[,
                      .(x, cdf = sapply(x, function(x) binom.rbeta.cdf(x, .1, n.samples)))][,
                      .(x, cdf, pdf = diff(cdf))]
ggplot(pdf.rbeta) + geom_line(aes(x/n.samples, pdf))

###################################################################################################
# https://stats.stackexchange.com/questions/194182/beta-as-distribution-of-proportions-or-as-continuous-binomial

binom.combobeta.pdf <- function(k,p=.5,n=10)
  (1/((n+1)*zipfR::Cbeta(k+1,n-k+1))) * p^k * (1-p)^(n-k)

binom.combobeta3.pdf <- function(u,p=.5,n=10)
  (1/zipfR::Cbeta(n*u+1,n*(1-u)+1)) * p^(n*u) * (1-p)^(n*(1-u))

ggplot(data = data.frame(x = 0), mapping = aes(x = x)) + xlim(0,10) +
  stat_function(fun = function(x) binom.combobeta3.pdf(x/10, p=.9, 10))

plot(data.frame(x = c(2, 3, 4, 5, 6, 7, 8, 9, 10),
           y = log(1+c(2, 6, 12, 26, 58, 125, 270, 575, 1200))))

###################################################################################################
# Wilson Score interval
# https://github.com/cran/binom/blob/master/R/binom.confint.R


wilson.plot.upper <- function(conf.level) {
x <- 10
n <- 20
#conf.level <- 0.95
p <- x/n
alpha <- 1 - conf.level
alpha <- rep(alpha, length = length(p))
alpha2 <- 0.5 * alpha
z <- qnorm(1 - alpha2)
z2 <- z * z
p1 <- p + 0.5 * z2/n
p2 <- z * sqrt((p * (1 - p) + 0.25 * z2/n)/n)
p3 <- 1 + z2/n
lcl <- (p1 - p2)/p3
ucl <- (p1 + p2)/p3

lcl
}

ggplot(data = data.frame(x = 0), mapping = aes(x = x)) + xlim(0,20) +
  stat_function(fun = wilson.plot)

binconfalpha.lower <- function(x) sapply(x, function(y) binconf.lower(10, 20, y))
binconfalpha.upper <- function(x) sapply(x, function(y) binconf.upper(10, 20, y))

ggplot(data = data.frame(x = 0), mapping = aes(x = x)) + xlim(0.01,.99) +
  stat_function(fun = function(x) binconfalpha.lower(x))
ggplot(data = data.frame(x = 0), mapping = aes(x = x)) + xlim(0.01,.99) +
  stat_function(fun = function(x) binconfalpha.upper(1-x))

######################## vvvvv Works vvvvv ########################

binconf.domain <- seq(0.01, .99, by=0.001)
binconf.lower.vals <- sapply(domain, function(x) binconf.lower(5, 10, x))
binconf.upper.vals <- sapply(domain, function(x) binconf.upper(5, 10, 1-x))

binconf.vals <- rbind(data.table(bound = binconf.lower.vals, conf = binconf.domain),
                      data.table(bound = binconf.upper.vals, conf = 1+binconf.domain))

binconf.vals[, conf.diff := diff(conf)/diff(bound)]

# ggplot(binconf.vals, aes(bound, conf)) + geom_point() # CDF

ggplot(binconf.vals, aes(bound, conf.diff)) + geom_point() + lims(x=c(0,1), y=c(0, 5))


######################## ^^^^^ Works ^^^^^ ########################


####################### Derivative of Wilson ######################
# no continuity: https://sandbox.open.wolframcloud.com/app/objects/8548ff8c-02c6-44ec-a807-9995540362c6#sidebar=compute
# continuity: https://sandbox.open.wolframcloud.com/app/objects/a53a3380-e668-4f6b-aba1-a87dbba8044f#sidebar=compute

p <- 0.8
n <- 1000

# with continuity correction
#binom.continuity.deriv <- function(z) -((2*z-z^2/sqrt(-2-1/n+4*p+4*n*(1-p)*p+z^2)-sqrt(-2-1/n+4*p+4*n*(1-p)*p+z^2))/(2*(n+z^2))-(z*(-1+2*n*p+z^2-z*sqrt(-2-1/n+4*p+4*n*(1-p)*p+z^2)))/(n+z^2)^2)
binom.deriv <- function(z)
  (2*z^2*sqrt(((1-p)*p)/n+z^2/(4*n^2)))/(n*(1+z^2/n)^2)-(2*z*(p+z^2/(2*n)))/(n*(1+z^2/n)^2)+z/(n*(1+z^2/n))-z^2/(4*n^2*sqrt(((1-p)*p)/n+z^2/(4*n^2))*(1+z^2/n))-sqrt(((1-p)*p)/n+z^2/(4*n^2))/(1+z^2/n)


ggplot(data = data.frame(x = 0), mapping = aes(x = x)) + xlim(-20,1000) +
  stat_function(fun = binom.deriv)
 
 